"""Unit tests for Mode B text-based chapter extraction (boss's spec).

Tests cover:
- extract_chapter_from_text() calls Gemini with the correct prompt
- ChapterContext is returned as a dict
- run_pipeline() pre-extracts chapterContext when chapterPdfText is provided
- run_pipeline() skips extraction when chapterPdfText is None (Mode A)
- POST /generate with chapterPdfText reaches extract_chapter_from_text()
- POST /generate without chapterPdfText runs Mode A (no extraction call)

All tests mock generate_structured so no real Gemini calls are made.
"""

from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest
from fastapi.testclient import TestClient

from app.schemas.sections import ChapterContext


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

_DUMMY_CHAPTER_CTX = ChapterContext(
    concepts=["Photosynthesis", "Chlorophyll", "Glucose"],
    definitions=["Photosynthesis: process by which plants convert light to food"],
    examples=["Hydrilla releasing oxygen bubbles under light"],
    exercises=["Q1: Why do leaves appear green?", "Q2: Write the photosynthesis equation"],
    subtopics=["Introduction", "Light reactions", "Dark reactions"],
    learningFlow="Starts with basic concepts, covers reactions, ends with importance.",
)

_SAMPLE_CHAPTER_TEXT = """
Chapter 1: Nutrition in Plants

Photosynthesis is the process by which green plants prepare their own food.
The green colour of plants is due to the presence of chlorophyll.

Key concept: Chlorophyll absorbs sunlight to produce glucose.

Exercise:
Q1: Why do leaves appear green?
Q2: Write the photosynthesis equation.
"""

_VALID_PAYLOAD_MODE_A = {
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
}

_VALID_PAYLOAD_MODE_B_TEXT = {
    **_VALID_PAYLOAD_MODE_A,
    "chapterPdfText": _SAMPLE_CHAPTER_TEXT,
}


# ---------------------------------------------------------------------------
# Tests for extract_chapter_from_text() utility
# ---------------------------------------------------------------------------

class TestExtractChapterFromText:
    def test_returns_chapter_context_dict(self):
        from app.utils.text_chapter_extractor import extract_chapter_from_text

        with patch("app.llm.retry.generate_structured", return_value=_DUMMY_CHAPTER_CTX):
            result = extract_chapter_from_text(
                text=_SAMPLE_CHAPTER_TEXT,
                grade="7",
                subject="Science",
                topic="Photosynthesis",
                board="CBSE",
            )

        assert isinstance(result, dict)
        assert "concepts" in result
        assert "exercises" in result
        assert "definitions" in result
        assert "subtopics" in result
        assert "learningFlow" in result

    def test_returns_concepts_from_gemini_output(self):
        from app.utils.text_chapter_extractor import extract_chapter_from_text

        with patch("app.llm.retry.generate_structured", return_value=_DUMMY_CHAPTER_CTX):
            result = extract_chapter_from_text(
                text=_SAMPLE_CHAPTER_TEXT,
                grade="7",
                subject="Science",
                topic="Photosynthesis",
                board="CBSE",
            )

        assert result["concepts"] == _DUMMY_CHAPTER_CTX.concepts
        assert result["exercises"] == _DUMMY_CHAPTER_CTX.exercises

    def test_uses_chapter_extraction_text_prompt(self):
        from app.utils.text_chapter_extractor import extract_chapter_from_text

        prompts_seen = []

        def capture(prompt, response_schema, model):
            prompts_seen.append(prompt)
            return _DUMMY_CHAPTER_CTX

        with patch("app.llm.retry.generate_structured", side_effect=capture):
            extract_chapter_from_text(
                text=_SAMPLE_CHAPTER_TEXT,
                grade="7",
                subject="Science",
                topic="Photosynthesis",
                board="CBSE",
            )

        assert len(prompts_seen) == 1
        # Chapter text must appear in the prompt
        assert "Photosynthesis" in prompts_seen[0]
        # Grade and board context must appear
        assert "7" in prompts_seen[0]
        assert "CBSE" in prompts_seen[0]

    def test_chapter_text_appears_in_prompt(self):
        from app.utils.text_chapter_extractor import extract_chapter_from_text

        prompts_seen = []

        def capture(prompt, response_schema, model):
            prompts_seen.append(prompt)
            return _DUMMY_CHAPTER_CTX

        with patch("app.llm.retry.generate_structured", side_effect=capture):
            extract_chapter_from_text(
                text="Unique marker: chlorophyll absorbs light",
                grade="7",
                subject="Science",
                topic="Photosynthesis",
                board="CBSE",
            )

        assert "Unique marker: chlorophyll absorbs light" in prompts_seen[0]

    def test_uses_heavy_model(self):
        from app.utils.text_chapter_extractor import extract_chapter_from_text
        from app.config import get_settings

        models_used = []

        def capture(prompt, response_schema, model):
            models_used.append(model)
            return _DUMMY_CHAPTER_CTX

        with patch("app.llm.retry.generate_structured", side_effect=capture):
            extract_chapter_from_text(
                text=_SAMPLE_CHAPTER_TEXT,
                grade="7",
                subject="Science",
                topic="Photosynthesis",
                board="CBSE",
            )

        assert models_used[0] == get_settings().model_name_heavy

    def test_raises_runtime_error_when_gemini_fails(self):
        from app.utils.text_chapter_extractor import extract_chapter_from_text

        with patch("app.llm.retry.generate_structured", side_effect=RuntimeError("LLM error")):
            with pytest.raises(RuntimeError):
                extract_chapter_from_text(
                    text=_SAMPLE_CHAPTER_TEXT,
                    grade="7",
                    subject="Science",
                    topic="Photosynthesis",
                    board="CBSE",
                )


# ---------------------------------------------------------------------------
# Tests for run_pipeline() Mode B text path
# ---------------------------------------------------------------------------

class TestRunPipelineWithChapterText:
    async def test_extract_chapter_called_when_chapter_pdf_text_provided(self):
        from app.graph.pipeline import run_pipeline
        from app.schemas.inputs import GenerateRequest

        req = GenerateRequest(**_VALID_PAYLOAD_MODE_B_TEXT)

        dummy_plan_sections = {
            "objectives": ["Obj 1"],
            "prerequisites": ["Prereq 1"],
            "materials": ["Mat 1"],
            "activities": {
                "intro": "I", "instruction": "T", "guidedPractice": "G",
                "independentPractice": "P", "closure": "C",
            },
            "assessment": {"formative": "F", "summative": "S"},
            "differentiation": {"slowLearners": "SL", "advancedLearners": "AL"},
            "homework": "HW",
            "standards": ["Std 1"],
            "timeBreakdown": {"intro": 5, "instruction": 15, "guidedPractice": 9,
                              "independentPractice": 11, "closure": 5},
        }

        with patch(
            "app.graph.pipeline.extract_chapter_from_text",
            return_value=_DUMMY_CHAPTER_CTX.model_dump(),
        ) as mock_extract:
            with patch("app.llm.retry.generate_structured") as mock_llm:
                from app.schemas.sections import (
                    ObjectivesOutput, PrerequisitesOutput, MaterialsOutput,
                    ActivitiesOutput, AssessmentOutput, DifferentiationOutput,
                    HomeworkOutput, StandardsOutput, TimeBreakdownOutput,
                )
                def llm_side_effect(prompt, response_schema, model):
                    mapping = {
                        ObjectivesOutput: ObjectivesOutput(objectives=["Obj 1"]),
                        PrerequisitesOutput: PrerequisitesOutput(prerequisites=["Prereq 1"]),
                        MaterialsOutput: MaterialsOutput(materials=["Mat 1"]),
                        ActivitiesOutput: ActivitiesOutput(intro="I", instruction="T",
                            guidedPractice="G", independentPractice="P", closure="C"),
                        AssessmentOutput: AssessmentOutput(formative="F", summative="S"),
                        DifferentiationOutput: DifferentiationOutput(
                            slowLearners="SL", advancedLearners="AL"),
                        HomeworkOutput: HomeworkOutput(homework="HW"),
                        StandardsOutput: StandardsOutput(standards=["Std 1"]),
                        TimeBreakdownOutput: TimeBreakdownOutput(
                            intro=5, instruction=15, guidedPractice=9,
                            independentPractice=11, closure=5),
                    }
                    return mapping[response_schema]
                mock_llm.side_effect = llm_side_effect

                result = await run_pipeline(req)

        # extract_chapter_from_text must have been called once
        mock_extract.assert_called_once_with(
            text=_SAMPLE_CHAPTER_TEXT,
            grade="7",
            subject="Science",
            topic="Photosynthesis",
            board="CBSE",
        )

    async def test_extract_chapter_not_called_for_mode_a(self):
        """Mode A: no chapterPdfText → extract_chapter_from_text must NOT be called."""
        from app.graph.pipeline import run_pipeline
        from app.schemas.inputs import GenerateRequest

        req = GenerateRequest(**_VALID_PAYLOAD_MODE_A)

        with patch(
            "app.graph.pipeline.extract_chapter_from_text",
        ) as mock_extract:
            with patch("app.llm.retry.generate_structured") as mock_llm:
                from app.schemas.sections import (
                    ObjectivesOutput, PrerequisitesOutput, MaterialsOutput,
                    ActivitiesOutput, AssessmentOutput, DifferentiationOutput,
                    HomeworkOutput, StandardsOutput, TimeBreakdownOutput,
                )
                def llm_side_effect(prompt, response_schema, model):
                    mapping = {
                        ObjectivesOutput: ObjectivesOutput(objectives=["Obj"]),
                        PrerequisitesOutput: PrerequisitesOutput(prerequisites=["Pre"]),
                        MaterialsOutput: MaterialsOutput(materials=["Mat"]),
                        ActivitiesOutput: ActivitiesOutput(intro="I", instruction="T",
                            guidedPractice="G", independentPractice="P", closure="C"),
                        AssessmentOutput: AssessmentOutput(formative="F", summative="S"),
                        DifferentiationOutput: DifferentiationOutput(
                            slowLearners="SL", advancedLearners="AL"),
                        HomeworkOutput: HomeworkOutput(homework="HW"),
                        StandardsOutput: StandardsOutput(standards=["Std"]),
                        TimeBreakdownOutput: TimeBreakdownOutput(
                            intro=5, instruction=15, guidedPractice=9,
                            independentPractice=11, closure=5),
                    }
                    return mapping[response_schema]
                mock_llm.side_effect = llm_side_effect

                await run_pipeline(req)

        mock_extract.assert_not_called()


# ---------------------------------------------------------------------------
# Tests for POST /generate endpoint with chapterPdfText
# ---------------------------------------------------------------------------

class TestGenerateEndpointWithChapterText:
    @pytest.fixture
    def client(self):
        from app.main import app
        return TestClient(app)

    def _dummy_plan(self):
        from app.schemas.outputs import LessonPlan
        from app.schemas.sections import (
            ActivitiesOutput, AssessmentOutput, DifferentiationOutput, TimeBreakdownOutput,
        )
        return LessonPlan(
            objectives=["Obj 1"],
            prerequisites=["Pre 1"],
            materials=["Mat 1"],
            activities=ActivitiesOutput(intro="I", instruction="T",
                guidedPractice="G", independentPractice="P", closure="C"),
            assessment=AssessmentOutput(formative="F", summative="S"),
            differentiation=DifferentiationOutput(slowLearners="SL", advancedLearners="AL"),
            homework="HW",
            standards=["Std 1"],
            timeBreakdown=TimeBreakdownOutput(intro=5, instruction=15, guidedPractice=9,
                                              independentPractice=11, closure=5),
        )

    def test_200_mode_a_no_chapter_text(self, client):
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.return_value = self._dummy_plan()
            response = client.post("/generate", json=_VALID_PAYLOAD_MODE_A)
        assert response.status_code == 200

    def test_200_mode_b_with_chapter_text(self, client):
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.return_value = self._dummy_plan()
            response = client.post("/generate", json=_VALID_PAYLOAD_MODE_B_TEXT)
        assert response.status_code == 200

    def test_chapter_text_passed_to_run_pipeline(self, client):
        """Verify run_pipeline receives the chapterPdfText in the request."""
        captured_req = {}

        async def capture(req):
            captured_req["chapterPdfText"] = req.chapterPdfText
            return self._dummy_plan()

        with patch("app.main.run_pipeline", side_effect=capture):
            client.post("/generate", json=_VALID_PAYLOAD_MODE_B_TEXT)

        assert captured_req["chapterPdfText"] == _SAMPLE_CHAPTER_TEXT

    def test_422_chapter_text_too_short(self, client):
        response = client.post(
            "/generate",
            json={**_VALID_PAYLOAD_MODE_A, "chapterPdfText": "short"},
        )
        assert response.status_code == 422

    def test_422_chapter_text_too_long(self, client):
        response = client.post(
            "/generate",
            json={**_VALID_PAYLOAD_MODE_A, "chapterPdfText": "x" * 60000},
        )
        assert response.status_code == 422
