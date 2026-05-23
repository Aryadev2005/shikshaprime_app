"""
Unit tests for S2 — Mode B PDF upload infrastructure.

All tests mock the Gemini client so no real API calls are made.
"""

import io
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.graph.pipeline import _entry_route
from app.graph.state import LessonPlanState
from app.schemas.sections import ChapterContext


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


@pytest.fixture
def sample_chapter_context() -> ChapterContext:
    return ChapterContext(
        concepts=["Photosynthesis", "Chlorophyll", "Light reactions"],
        definitions=["Photosynthesis: the process by which plants convert light energy to chemical energy"],
        examples=["Leaf colour experiment showing chlorophyll role"],
        exercises=["1. Define photosynthesis. 2. Name the products of the light reaction."],
        subtopics=["Introduction", "Light reactions", "Dark reactions", "Significance"],
        learningFlow="The chapter introduces basic concepts, covers light and dark reactions, then discusses significance.",
    )


@pytest.fixture
def mode_b_state() -> LessonPlanState:
    return {
        "grade": "7",
        "subject": "Science",
        "topic": "Photosynthesis",
        "duration": 45,
        "board": "CBSE",
        "teachingStyle": "Activity-based",
        "depth": "Standard",
        "geminiFileUri": "https://generativelanguage.googleapis.com/v1beta/files/abc123",
    }


# ---------------------------------------------------------------------------
# Task 2.0.1 — _entry_route conditional routing
# ---------------------------------------------------------------------------

class TestEntryRoute:
    def test_mode_a_routes_to_objectives(self):
        state = {"grade": "7", "subject": "Science"}
        assert _entry_route(state) == "objectives"

    def test_mode_b_routes_to_chapter_extraction(self):
        state = {"geminiFileUri": "https://generativelanguage.googleapis.com/v1beta/files/abc"}
        assert _entry_route(state) == "chapter_extraction"

    def test_empty_string_uri_treated_as_mode_a(self):
        state = {"geminiFileUri": ""}
        assert _entry_route(state) == "objectives"

    def test_none_uri_treated_as_mode_a(self):
        state = {"geminiFileUri": None}
        assert _entry_route(state) == "objectives"


# ---------------------------------------------------------------------------
# Task 2.0.2 — upload_pdf_to_gemini utility
# ---------------------------------------------------------------------------

class TestUploadPdfToGemini:
    def test_returns_file_uri(self):
        mock_file = MagicMock()
        mock_file.name = "files/abc123"
        mock_file.uri = "https://generativelanguage.googleapis.com/v1beta/files/abc123"

        mock_client = MagicMock()
        mock_client.files.upload.return_value = mock_file

        with patch("app.utils.pdf_uploader.get_gemini_client", return_value=mock_client):
            from app.utils.pdf_uploader import upload_pdf_to_gemini
            uri = upload_pdf_to_gemini(b"%PDF-1.4 fake content")

        assert uri == "https://generativelanguage.googleapis.com/v1beta/files/abc123"

    def test_uploads_with_pdf_mime_type(self):
        mock_file = MagicMock()
        mock_file.uri = "https://generativelanguage.googleapis.com/v1beta/files/xyz"
        mock_client = MagicMock()
        mock_client.files.upload.return_value = mock_file

        with patch("app.utils.pdf_uploader.get_gemini_client", return_value=mock_client):
            from app.utils.pdf_uploader import upload_pdf_to_gemini
            upload_pdf_to_gemini(b"fake pdf bytes")

        call_kwargs = mock_client.files.upload.call_args
        config_arg = call_kwargs.kwargs.get("config") or call_kwargs[1].get("config")
        assert config_arg["mime_type"] == "application/pdf"

    def test_passes_bytes_as_bytesio(self):
        mock_file = MagicMock()
        mock_file.uri = "https://generativelanguage.googleapis.com/v1beta/files/xyz"
        mock_client = MagicMock()
        mock_client.files.upload.return_value = mock_file

        with patch("app.utils.pdf_uploader.get_gemini_client", return_value=mock_client):
            from app.utils.pdf_uploader import upload_pdf_to_gemini
            upload_pdf_to_gemini(b"fake pdf bytes")

        call_args = mock_client.files.upload.call_args
        file_arg = call_args.kwargs.get("file") or call_args[1].get("file")
        assert isinstance(file_arg, io.BytesIO)


# ---------------------------------------------------------------------------
# Task 2.0.3 — generate_structured_with_file
# ---------------------------------------------------------------------------

class TestGenerateStructuredWithFile:
    def _make_mock_response(self, parsed_obj):
        mock_response = MagicMock()
        mock_response.parsed = parsed_obj
        return mock_response

    def test_returns_parsed_pydantic_model(self, sample_chapter_context):
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = self._make_mock_response(sample_chapter_context)

        with patch("app.llm.client.get_gemini_client", return_value=mock_client):
            from app.llm.client import generate_structured_with_file
            result = generate_structured_with_file(
                prompt="Extract content",
                file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                response_schema=ChapterContext,
                model="gemini-2.5-flash",
            )

        assert isinstance(result, ChapterContext)
        assert result.concepts == sample_chapter_context.concepts

    def test_raises_value_error_when_parsed_is_none(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.parsed = None
        mock_response.candidates = []
        mock_response.text = ""
        mock_client.models.generate_content.return_value = mock_response

        with patch("app.llm.client.get_gemini_client", return_value=mock_client):
            from app.llm.client import generate_structured_with_file
            with pytest.raises(ValueError, match="None"):
                generate_structured_with_file(
                    prompt="Extract content",
                    file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                    response_schema=ChapterContext,
                    model="gemini-2.5-flash",
                )

    def test_sends_pdf_file_part_and_text_part(self, sample_chapter_context):
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = self._make_mock_response(sample_chapter_context)

        with patch("app.llm.client.get_gemini_client", return_value=mock_client):
            from app.llm.client import generate_structured_with_file
            generate_structured_with_file(
                prompt="Extract content",
                file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                response_schema=ChapterContext,
                model="gemini-2.5-flash",
            )

        call_kwargs = mock_client.models.generate_content.call_args
        contents = call_kwargs.kwargs.get("contents") or call_kwargs[1].get("contents")
        assert isinstance(contents, list)
        assert len(contents) == 2

    def test_retries_once_on_429(self, sample_chapter_context):
        from google.genai import errors as genai_errors

        mock_client = MagicMock()
        mock_response = self._make_mock_response(sample_chapter_context)

        call_count = {"n": 0}
        # ClientError requires (message, response_json) — use a minimal dict
        rate_limit_error = genai_errors.ClientError(
            "429 RESOURCE_EXHAUSTED",
            {"error": {"code": 429, "message": "Resource exhausted", "status": "RESOURCE_EXHAUSTED"}},
        )

        def side_effect(*args, **kwargs):
            call_count["n"] += 1
            if call_count["n"] == 1:
                raise rate_limit_error
            return mock_response

        mock_client.models.generate_content.side_effect = side_effect

        with patch("app.llm.client.get_gemini_client", return_value=mock_client):
            with patch("app.llm.client.time.sleep"):
                from app.llm.client import generate_structured_with_file
                result = generate_structured_with_file(
                    prompt="Extract",
                    file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                    response_schema=ChapterContext,
                    model="gemini-2.5-flash",
                )

        assert call_count["n"] == 2
        assert isinstance(result, ChapterContext)


# ---------------------------------------------------------------------------
# Task 2.0.3 continued — call_with_retry_file
# ---------------------------------------------------------------------------

class TestCallWithRetryFile:
    def test_success_first_attempt(self, sample_chapter_context):
        with patch("app.llm.retry.generate_structured_with_file", return_value=sample_chapter_context):
            from app.llm.retry import call_with_retry_file
            result = call_with_retry_file(
                prompt="Extract",
                file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                response_schema=ChapterContext,
                model="gemini-2.5-flash",
                max_retries=2,
            )
        assert result is sample_chapter_context

    def test_retries_on_value_error(self, sample_chapter_context):
        call_count = {"n": 0}

        def side_effect(**kwargs):
            call_count["n"] += 1
            if call_count["n"] == 1:
                raise ValueError("invalid json")
            return sample_chapter_context

        with patch("app.llm.retry.generate_structured_with_file", side_effect=side_effect):
            from app.llm.retry import call_with_retry_file
            result = call_with_retry_file(
                prompt="Extract",
                file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                response_schema=ChapterContext,
                model="gemini-2.5-flash",
                max_retries=2,
            )

        assert call_count["n"] == 2
        assert result is sample_chapter_context

    def test_raises_runtime_error_after_max_retries(self):
        with patch("app.llm.retry.generate_structured_with_file", side_effect=ValueError("bad")):
            from app.llm.retry import call_with_retry_file
            with pytest.raises(RuntimeError, match="Failed to generate valid ChapterContext"):
                call_with_retry_file(
                    prompt="Extract",
                    file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                    response_schema=ChapterContext,
                    model="gemini-2.5-flash",
                    max_retries=1,
                )

    def test_appends_error_to_prompt_on_retry(self, sample_chapter_context):
        prompts_seen = []

        def side_effect(**kwargs):
            prompts_seen.append(kwargs["prompt"])
            if len(prompts_seen) == 1:
                raise ValueError("missing field")
            return sample_chapter_context

        with patch("app.llm.retry.generate_structured_with_file", side_effect=side_effect):
            from app.llm.retry import call_with_retry_file
            call_with_retry_file(
                prompt="Original prompt",
                file_uri="https://generativelanguage.googleapis.com/v1beta/files/abc",
                response_schema=ChapterContext,
                model="gemini-2.5-flash",
                max_retries=2,
            )

        assert prompts_seen[0] == "Original prompt"
        assert "missing field" in prompts_seen[1]
        assert "Original prompt" in prompts_seen[1]


# ---------------------------------------------------------------------------
# Task 2.1.3 — chapter_extraction node
# ---------------------------------------------------------------------------

class TestChapterExtractionNode:
    def test_run_sets_chapter_context_in_state(self, mode_b_state, sample_chapter_context):
        with patch("app.nodes.chapter_extraction.call_with_retry_file", return_value=sample_chapter_context):
            from app.nodes.chapter_extraction import run
            result = run(mode_b_state)

        assert "chapterContext" in result
        ctx = result["chapterContext"]
        assert ctx["concepts"] == sample_chapter_context.concepts
        assert ctx["exercises"] == sample_chapter_context.exercises

    def test_run_loads_chapter_extraction_prompt(self, mode_b_state, sample_chapter_context):
        with patch("app.nodes.chapter_extraction.call_with_retry_file", return_value=sample_chapter_context) as mock_retry:
            with patch("app.nodes.chapter_extraction.load_prompt", return_value="prompt text") as mock_load:
                from app.nodes.chapter_extraction import run
                run(mode_b_state)

        mock_load.assert_called_once_with("chapter_extraction")

    def test_run_passes_file_uri_to_retry(self, mode_b_state, sample_chapter_context):
        with patch("app.nodes.chapter_extraction.call_with_retry_file", return_value=sample_chapter_context) as mock_retry:
            from app.nodes.chapter_extraction import run
            run(mode_b_state)

        call_kwargs = mock_retry.call_args.kwargs
        assert call_kwargs["file_uri"] == mode_b_state["geminiFileUri"]
        assert call_kwargs["response_schema"] is ChapterContext

    def test_run_returns_model_dump(self, mode_b_state, sample_chapter_context):
        with patch("app.nodes.chapter_extraction.call_with_retry_file", return_value=sample_chapter_context):
            from app.nodes.chapter_extraction import run
            result = run(mode_b_state)

        assert isinstance(result["chapterContext"], dict)
        assert "learningFlow" in result["chapterContext"]


# ---------------------------------------------------------------------------
# Task 2.0.4 — POST /generate-with-pdf endpoint
# ---------------------------------------------------------------------------

class TestGenerateWithPdfEndpoint:
    FORM_FIELDS = {
        "grade": "7",
        "subject": "Science",
        "topic": "Photosynthesis",
        "duration": "45",
        "board": "CBSE",
        "teachingStyle": "Activity-based",
        "depth": "Standard",
    }

    def _make_lesson_plan(self):
        from app.schemas.outputs import LessonPlan
        from app.schemas.sections import (
            ActivitiesOutput, AssessmentOutput, DifferentiationOutput,
            TimeBreakdownOutput,
        )
        return LessonPlan(
            objectives=["Define photosynthesis"],
            prerequisites=["Know plant cell parts"],
            materials=["NCERT textbook"],
            activities=ActivitiesOutput(
                intro="Open with a question",
                instruction="Explain the process",
                guidedPractice="Draw a diagram together",
                independentPractice="Label blank diagram",
                closure="Exit ticket",
            ),
            assessment=AssessmentOutput(
                formative="Thumbs up/down check",
                summative="1. What is photosynthesis?",
            ),
            differentiation=DifferentiationOutput(
                slowLearners="Provide filled diagram",
                advancedLearners="Research C4 plants",
            ),
            homework="Complete worksheet",
            standards=["CBSE Science Grade 7.LP-S1"],
            timeBreakdown=TimeBreakdownOutput(
                intro=5, instruction=15, guidedPractice=9,
                independentPractice=12, closure=4,
            ),
        )

    def test_rejects_oversized_pdf(self, client):
        from app.config import get_settings
        settings = get_settings()
        oversized = b"x" * (settings.max_pdf_size_mb * 1024 * 1024 + 1)
        response = client.post(
            "/generate-with-pdf",
            data=self.FORM_FIELDS,
            files={"pdf_file": ("test.pdf", oversized, "application/pdf")},
        )
        assert response.status_code == 413
        assert "maximum allowed size" in response.json()["detail"]

    def test_rejects_invalid_depth(self, client):
        response = client.post(
            "/generate-with-pdf",
            data={**self.FORM_FIELDS, "depth": "InvalidDepth"},
            files={"pdf_file": ("test.pdf", b"%PDF fake", "application/pdf")},
        )
        assert response.status_code == 422

    def test_rejects_invalid_duration(self, client):
        response = client.post(
            "/generate-with-pdf",
            data={**self.FORM_FIELDS, "duration": "0"},
            files={"pdf_file": ("test.pdf", b"%PDF fake", "application/pdf")},
        )
        assert response.status_code == 422

    def test_returns_503_when_upload_fails(self, client):
        with patch("app.main.upload_pdf_to_gemini", side_effect=Exception("Gemini down")):
            response = client.post(
                "/generate-with-pdf",
                data=self.FORM_FIELDS,
                files={"pdf_file": ("test.pdf", b"%PDF fake", "application/pdf")},
            )
        assert response.status_code == 503
        assert response.json()["detail"] == "Upstream AI service unavailable"

    def test_returns_502_when_pipeline_fails(self, client):
        with patch("app.main.upload_pdf_to_gemini", return_value="https://genai.../files/abc"):
            with patch("app.main.run_pipeline_with_pdf", new_callable=AsyncMock, side_effect=RuntimeError("node failed")):
                response = client.post(
                    "/generate-with-pdf",
                    data=self.FORM_FIELDS,
                    files={"pdf_file": ("test.pdf", b"%PDF fake", "application/pdf")},
                )
        assert response.status_code == 502
        assert response.json()["detail"] == "Generation failed. Please retry."

    def test_success_returns_lesson_plan(self, client):
        lesson_plan = self._make_lesson_plan()
        with patch("app.main.upload_pdf_to_gemini", return_value="https://genai.../files/abc"):
            with patch("app.main.run_pipeline_with_pdf", new_callable=AsyncMock, return_value=lesson_plan):
                response = client.post(
                    "/generate-with-pdf",
                    data=self.FORM_FIELDS,
                    files={"pdf_file": ("test.pdf", b"%PDF fake", "application/pdf")},
                )
        assert response.status_code == 200
        body = response.json()
        assert "objectives" in body
        assert "activities" in body
        assert "timeBreakdown" in body

    def test_success_passes_gemini_file_uri_to_pipeline(self, client):
        lesson_plan = self._make_lesson_plan()
        expected_uri = "https://generativelanguage.googleapis.com/v1beta/files/abc123"
        captured_state = {}

        async def capture_state(initial_state):
            captured_state.update(initial_state)
            return lesson_plan

        with patch("app.main.upload_pdf_to_gemini", return_value=expected_uri):
            with patch("app.main.run_pipeline_with_pdf", side_effect=capture_state):
                client.post(
                    "/generate-with-pdf",
                    data=self.FORM_FIELDS,
                    files={"pdf_file": ("test.pdf", b"%PDF fake", "application/pdf")},
                )

        assert captured_state.get("geminiFileUri") == expected_uri
        assert captured_state.get("grade") == "7"
        assert captured_state.get("depth") == "Standard"

    def test_generate_with_pdf_endpoint_in_swagger(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        paths = response.json()["paths"]
        assert "/generate-with-pdf" in paths
        assert "post" in paths["/generate-with-pdf"]
