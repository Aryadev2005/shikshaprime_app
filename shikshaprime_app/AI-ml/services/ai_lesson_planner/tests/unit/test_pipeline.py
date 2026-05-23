"""Tests for the LangGraph pipeline and the POST /generate endpoint.

Pipeline tests verify:
- build_graph() compiles without error (all 10 nodes registered)
- run_pipeline() returns a LessonPlan when all nodes succeed (mocked LLM)

Endpoint tests verify:
- POST /generate 200 OK with valid payload
- POST /generate 422 on invalid depth (enforced by Pydantic Literal)
- POST /generate 503 when pipeline raises ValueError (no API key)
- POST /generate 502 when pipeline raises RuntimeError (LLM failure)
"""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.inputs import GenerateRequest
from app.schemas.outputs import LessonPlan
from app.schemas.sections import (
    ActivitiesOutput,
    AssessmentOutput,
    DifferentiationOutput,
    HomeworkOutput,
    MaterialsOutput,
    ObjectivesOutput,
    PrerequisitesOutput,
    StandardsOutput,
    TimeBreakdownOutput,
)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

_VALID_PAYLOAD = {
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
}

_DUMMY_PLAN = LessonPlan(
    objectives=["Define photosynthesis", "Explain chlorophyll role"],
    prerequisites=["Know plant cells exist"],
    materials=["NCERT textbook Ch.1", "Whiteboard"],
    activities=ActivitiesOutput(
        intro="Show a wilting plant and ask what it needs",
        instruction="Draw the photosynthesis equation on the board",
        guidedPractice="Think-pair-share: what happens in the dark?",
        independentPractice="Label a blank chloroplast diagram",
        closure="Exit ticket: one reactant and one product",
    ),
    assessment=AssessmentOutput(
        formative="Thumbs up/down on 3 statements",
        summative="Q1: Write the equation. Q2: Why are leaves green?",
    ),
    differentiation=DifferentiationOutput(
        slowLearners="Provide a partially filled diagram",
        advancedLearners="Research CAM plant differences",
    ),
    homework="Task 1: Draw and label the photosynthesis process.",
    standards=["CBSE Science Grade 7.Life Processes.LP-S1: Define photosynthesis"],
    timeBreakdown=TimeBreakdownOutput(
        intro=5, instruction=15, guidedPractice=9, independentPractice=11, closure=5,
    ),
)


def _make_mock_generate(duration: int = 45) -> callable:
    """Return a side_effect function that maps response_schema → dummy output."""
    schema_map = {
        ObjectivesOutput: ObjectivesOutput(objectives=["Define", "Explain", "Apply"]),
        PrerequisitesOutput: PrerequisitesOutput(prerequisites=["Know cells"]),
        MaterialsOutput: MaterialsOutput(materials=["NCERT textbook", "Whiteboard"]),
        ActivitiesOutput: ActivitiesOutput(
            intro="Hook", instruction="Teach",
            guidedPractice="Practice", independentPractice="Work", closure="Recap",
        ),
        AssessmentOutput: AssessmentOutput(formative="Quick check", summative="Q1: Define it"),
        DifferentiationOutput: DifferentiationOutput(
            slowLearners="Scaffold diagram", advancedLearners="Extension task",
        ),
        HomeworkOutput: HomeworkOutput(homework="Task 1: Draw diagram"),
        TimeBreakdownOutput: TimeBreakdownOutput(
            intro=round(duration * 0.1) or 1,
            instruction=round(duration * 0.33) or 1,
            guidedPractice=round(duration * 0.22) or 1,
            independentPractice=round(duration * 0.25) or 1,
            # closure gets the remainder to guarantee sum == duration
            closure=duration
                - round(duration * 0.1)
                - round(duration * 0.33)
                - round(duration * 0.22)
                - round(duration * 0.25),
        ),
        StandardsOutput: StandardsOutput(standards=["CBSE Science 7.LP-S1: Define"]),
    }

    def _side_effect(prompt, response_schema, model):
        return schema_map[response_schema]

    return _side_effect


# ---------------------------------------------------------------------------
# Pipeline graph tests
# ---------------------------------------------------------------------------

class TestBuildGraph:
    def test_graph_compiles_at_import(self) -> None:
        from app.graph.pipeline import _graph
        assert _graph is not None

    def test_graph_has_correct_node_count(self) -> None:
        from app.graph.pipeline import _graph
        # LangGraph compiled graph exposes node names via the graph attribute
        node_names = set(_graph.nodes.keys())
        expected = {
            "objectives", "prerequisites", "materials", "activities",
            "assessments", "differentiation", "homework", "time_breakdown",
            "standards", "assemble",
        }
        assert expected.issubset(node_names)


# ---------------------------------------------------------------------------
# Full pipeline integration (mocked LLM)
# ---------------------------------------------------------------------------

class TestRunPipeline:
    async def test_run_pipeline_returns_lesson_plan(self) -> None:
        from app.graph.pipeline import run_pipeline
        req = GenerateRequest(**_VALID_PAYLOAD)
        with patch("app.llm.retry.generate_structured", side_effect=_make_mock_generate(45)):
            result = await run_pipeline(req)
        assert isinstance(result, LessonPlan)

    async def test_run_pipeline_lesson_plan_has_all_sections(self) -> None:
        from app.graph.pipeline import run_pipeline
        req = GenerateRequest(**_VALID_PAYLOAD)
        with patch("app.llm.retry.generate_structured", side_effect=_make_mock_generate(45)):
            result = await run_pipeline(req)
        data = result.model_dump()
        required = {
            "objectives", "prerequisites", "materials", "activities",
            "assessment", "differentiation", "homework", "standards", "timeBreakdown",
        }
        assert required.issubset(data.keys())

    async def test_run_pipeline_60min_duration(self) -> None:
        from app.graph.pipeline import run_pipeline
        payload_60 = {**_VALID_PAYLOAD, "duration": 60}
        req = GenerateRequest(**payload_60)
        with patch("app.llm.retry.generate_structured", side_effect=_make_mock_generate(60)):
            result = await run_pipeline(req)
        tb = result.model_dump()["timeBreakdown"]
        assert sum(tb.values()) == 60

    async def test_run_pipeline_is_json_serialisable(self) -> None:
        from app.graph.pipeline import run_pipeline
        req = GenerateRequest(**_VALID_PAYLOAD)
        with patch("app.llm.retry.generate_structured", side_effect=_make_mock_generate(45)):
            result = await run_pipeline(req)
        json_str = result.model_dump_json()
        assert '"objectives"' in json_str
        assert '"timeBreakdown"' in json_str


# ---------------------------------------------------------------------------
# POST /generate endpoint tests
# ---------------------------------------------------------------------------

class TestGenerateEndpoint:
    def test_200_with_valid_mode_a_payload(self) -> None:
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.return_value = _DUMMY_PLAN
            response = client.post("/generate", json=_VALID_PAYLOAD)
        assert response.status_code == 200
        data = response.json()
        assert "objectives" in data
        assert "activities" in data
        assert "timeBreakdown" in data

    def test_200_response_contains_all_9_sections(self) -> None:
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.return_value = _DUMMY_PLAN
            response = client.post("/generate", json=_VALID_PAYLOAD)
        data = response.json()
        for section in (
            "objectives", "prerequisites", "materials", "activities",
            "assessment", "differentiation", "homework", "standards", "timeBreakdown",
        ):
            assert section in data, f"Missing section: {section}"

    def test_422_on_invalid_depth(self) -> None:
        bad_payload = {**_VALID_PAYLOAD, "depth": "Expert"}
        response = client.post("/generate", json=bad_payload)
        assert response.status_code == 422

    def test_422_on_missing_required_field(self) -> None:
        payload = {k: v for k, v in _VALID_PAYLOAD.items() if k != "grade"}
        response = client.post("/generate", json=payload)
        assert response.status_code == 422

    def test_422_on_duration_zero(self) -> None:
        response = client.post("/generate", json={**_VALID_PAYLOAD, "duration": 0})
        assert response.status_code == 422

    def test_503_when_pipeline_raises_value_error(self) -> None:
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.side_effect = ValueError("GEMINI_API_KEY is not set")
            response = client.post("/generate", json=_VALID_PAYLOAD)
        assert response.status_code == 503
        # Detail must be opaque — must NOT leak internal config names
        detail = response.json()["detail"]
        assert "GEMINI_API_KEY" not in detail
        assert "unavailable" in detail.lower()

    def test_502_when_pipeline_raises_runtime_error(self) -> None:
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.side_effect = RuntimeError("time_breakdown: sum 44 != 45 after 3 attempts")
            response = client.post("/generate", json=_VALID_PAYLOAD)
        assert response.status_code == 502
        # Detail must be opaque — must NOT leak internal node names or stack context
        detail = response.json()["detail"]
        assert "time_breakdown" not in detail

    def test_502_on_pipeline_timeout(self) -> None:
        import asyncio
        with patch("app.main.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.side_effect = RuntimeError("Pipeline timed out after 120s")
            response = client.post("/generate", json=_VALID_PAYLOAD)
        assert response.status_code == 502

    def test_generate_registered_in_openapi(self) -> None:
        response = client.get("/openapi.json")
        assert response.status_code == 200
        paths = response.json()["paths"]
        assert "/generate" in paths
        assert "post" in paths["/generate"]
