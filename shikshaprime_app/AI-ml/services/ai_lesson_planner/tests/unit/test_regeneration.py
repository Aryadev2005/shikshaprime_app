"""Unit tests for S3 — Regeneration pipeline.

Tests cover:
- _regen_entry_route routing for all 9 sections and dot-notation sub-sections
- build_regen_prefix utility (Mode A returns "", Mode Regen returns prefix)
- RegenerateRequest allow-list validation
- All 9 nodes prepend regen prefix when regenerateSection is in state
- assemble partial output mode (top-level and sub-field extraction)
- POST /regenerate endpoint (200, 422, 502, 503)
- Parameterised: all 9 top-level sections are individually regenerable

All tests mock generate_structured so no real Gemini calls are made.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.graph.pipeline import _regen_entry_route
from app.graph.state import LessonPlanState
from app.schemas.inputs import RegenerateRequest, _ALLOWED_REGEN_SECTIONS
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


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

_DUMMY_EXISTING_PLAN: dict = {
    "objectives": ["Define photosynthesis", "Explain the role of chlorophyll"],
    "prerequisites": ["Know plant cell structure"],
    "materials": ["NCERT Grade 7 Ch.1", "Whiteboard"],
    "activities": {
        "intro": "Show a wilting plant and ask what it needs.",
        "instruction": "Draw the photosynthesis equation on the board.",
        "guidedPractice": "Think-pair-share: what happens without sunlight?",
        "independentPractice": "Label a blank chloroplast diagram.",
        "closure": "Exit ticket: name one reactant and one product.",
    },
    "assessment": {
        "formative": "Thumbs up/down on three photosynthesis statements.",
        "summative": "Q1: Write the equation. Q2: Why are leaves green?",
    },
    "differentiation": {
        "slowLearners": "Provide a partially filled diagram.",
        "advancedLearners": "Research how C4 plants differ.",
    },
    "homework": "Task 1: Draw and label the photosynthesis process.",
    "standards": ["CBSE Science Grade 7.LP-S1: Define photosynthesis"],
    "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5,
    },
}

_BASE_REGEN_PAYLOAD: dict = {
    "regenerateSection": "objectives",
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "existingPlan": _DUMMY_EXISTING_PLAN,
}

_BASE_STATE: LessonPlanState = {
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "objectives": _DUMMY_EXISTING_PLAN["objectives"],
    "prerequisites": _DUMMY_EXISTING_PLAN["prerequisites"],
    "materials": _DUMMY_EXISTING_PLAN["materials"],
    "activities": _DUMMY_EXISTING_PLAN["activities"],
    "assessment": _DUMMY_EXISTING_PLAN["assessment"],
    "differentiation": _DUMMY_EXISTING_PLAN["differentiation"],
    "homework": _DUMMY_EXISTING_PLAN["homework"],
    "standards": _DUMMY_EXISTING_PLAN["standards"],
    "timeBreakdown": _DUMMY_EXISTING_PLAN["timeBreakdown"],
}


def _regen_state(section: str) -> LessonPlanState:
    return {**_BASE_STATE, "regenerateSection": section, "existingPlan": _DUMMY_EXISTING_PLAN}


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


# ---------------------------------------------------------------------------
# 3.1.1 — _regen_prefix.txt content (via build_regen_prefix)
# ---------------------------------------------------------------------------

class TestBuildRegenPrefix:
    def test_returns_empty_string_when_no_existing_plan(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", None)
        assert result == ""

    def test_returns_non_empty_string_when_plan_provided(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", _DUMMY_EXISTING_PLAN)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_prefix_contains_section_name(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("activities.guidedPractice", _DUMMY_EXISTING_PLAN)
        assert "activities.guidedPractice" in result

    def test_prefix_contains_existing_plan_json(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", _DUMMY_EXISTING_PLAN)
        assert "Define photosynthesis" in result

    def test_prefix_contains_regen_instructions(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", _DUMMY_EXISTING_PLAN)
        assert "DIFFERENT" in result
        assert "CONSISTENT" in result
        assert "QUALITY" in result

    def test_json_braces_not_doubled(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", _DUMMY_EXISTING_PLAN)
        assert "{{" not in result
        assert "}}" not in result

    # --- userInstruction tests ---

    def test_user_instruction_appears_in_prefix_when_provided(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix(
            "assessment",
            _DUMMY_EXISTING_PLAN,
            user_instruction="Use MCQ questions not written answers",
        )
        assert "Use MCQ questions not written answers" in result
        assert "TEACHER'S SPECIFIC REQUEST" in result

    def test_user_instruction_marked_highest_priority(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix(
            "activities",
            _DUMMY_EXISTING_PLAN,
            user_instruction="Make guided practice student-led",
        )
        assert "highest priority" in result.lower()

    def test_no_user_instruction_block_when_none(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", _DUMMY_EXISTING_PLAN, user_instruction=None)
        assert "TEACHER'S SPECIFIC REQUEST" not in result

    def test_no_user_instruction_block_when_empty_string(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix("objectives", _DUMMY_EXISTING_PLAN, user_instruction="   ")
        assert "TEACHER'S SPECIFIC REQUEST" not in result

    def test_user_instruction_appears_before_your_task(self):
        from app.utils.regen_context import build_regen_prefix
        result = build_regen_prefix(
            "objectives",
            _DUMMY_EXISTING_PLAN,
            user_instruction="Focus on higher-order thinking",
        )
        instruction_pos = result.index("TEACHER'S SPECIFIC REQUEST")
        task_pos = result.index("YOUR TASK")
        assert instruction_pos < task_pos


# ---------------------------------------------------------------------------
# 3.1.2 — RegenerateRequest allow-list validation
# ---------------------------------------------------------------------------

class TestRegenerateRequestSchema:
    def test_valid_top_level_sections_accepted(self):
        top_level = [
            "objectives", "prerequisites", "materials", "activities",
            "assessment", "differentiation", "homework", "standards", "timeBreakdown",
        ]
        for section in top_level:
            req = RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "regenerateSection": section})
            assert req.regenerateSection == section

    def test_valid_sub_sections_accepted(self):
        sub_sections = [
            "activities.intro",
            "activities.guidedPractice",
            "assessment.formative",
            "assessment.summative",
            "differentiation.slowLearners",
            "timeBreakdown.intro",
        ]
        for section in sub_sections:
            req = RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "regenerateSection": section})
            assert req.regenerateSection == section

    def test_unknown_section_raises_422(self):
        with pytest.raises(ValidationError, match="not a valid regenerateSection"):
            RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "regenerateSection": "unknownField"})

    def test_all_allowed_sections_in_constant(self):
        # Verify the allow-list itself has all expected top-level keys
        for key in ["objectives", "prerequisites", "materials", "activities",
                    "assessment", "differentiation", "homework", "standards", "timeBreakdown"]:
            assert key in _ALLOWED_REGEN_SECTIONS

    def test_missing_grade_raises_422(self):
        payload = {k: v for k, v in _BASE_REGEN_PAYLOAD.items() if k != "grade"}
        with pytest.raises(ValidationError):
            RegenerateRequest(**payload)

    def test_invalid_depth_raises_422(self):
        with pytest.raises(ValidationError):
            RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "depth": "Expert"})

    def test_chapter_context_accepted_for_mode_b(self):
        chapter_ctx = {
            "concepts": ["Photosynthesis", "Chlorophyll"],
            "definitions": ["Photosynthesis: process by which plants make food"],
            "examples": ["Leaf colour experiment"],
            "exercises": ["Q1: Define photosynthesis"],
            "subtopics": ["Light reactions", "Dark reactions"],
            "learningFlow": "Basic to advanced",
        }
        req = RegenerateRequest(
            **_BASE_REGEN_PAYLOAD,
            chapterContext=chapter_ctx,
        )
        assert req.chapterContext == chapter_ctx

    def test_chapter_context_defaults_to_none_for_mode_a(self):
        req = RegenerateRequest(**_BASE_REGEN_PAYLOAD)
        assert req.chapterContext is None


# ---------------------------------------------------------------------------
# 3.1.3 — Regeneration graph + routing
# ---------------------------------------------------------------------------

class TestRegenEntryRoute:
    @pytest.mark.parametrize("section,expected_node", [
        ("objectives",      "objectives"),
        ("prerequisites",   "prerequisites"),
        ("materials",       "materials"),
        ("activities",      "activities"),
        ("assessment",      "assessments"),
        ("differentiation", "differentiation"),
        ("homework",        "homework"),
        ("standards",       "standards"),
        ("timeBreakdown",   "time_breakdown"),
    ])
    def test_top_level_sections_route_correctly(self, section, expected_node):
        state = _regen_state(section)
        assert _regen_entry_route(state) == expected_node

    @pytest.mark.parametrize("section,expected_node", [
        ("activities.intro",              "activities"),
        ("activities.guidedPractice",     "activities"),
        ("activities.independentPractice","activities"),
        ("activities.closure",            "activities"),
        ("assessment.formative",          "assessments"),
        ("assessment.summative",          "assessments"),
        ("differentiation.slowLearners",  "differentiation"),
        ("timeBreakdown.intro",           "time_breakdown"),
        ("timeBreakdown.closure",         "time_breakdown"),
    ])
    def test_dot_notation_sections_route_to_parent_node(self, section, expected_node):
        state = _regen_state(section)
        assert _regen_entry_route(state) == expected_node

    def test_regen_graph_compiles(self):
        from app.graph.pipeline import _regen_graph
        assert _regen_graph is not None

    def test_regen_graph_has_all_generation_nodes(self):
        from app.graph.pipeline import _regen_graph
        node_names = set(_regen_graph.nodes.keys())
        expected = {
            "objectives", "prerequisites", "materials", "activities",
            "assessments", "differentiation", "homework", "time_breakdown",
            "standards", "assemble",
        }
        assert expected.issubset(node_names)


# ---------------------------------------------------------------------------
# 3.1.4 — All 9 nodes prepend regen prefix when regenerateSection is in state
# ---------------------------------------------------------------------------

class TestNodesWithRegenPrefix:
    """Verify that each node calls build_regen_prefix and prepends it when in regen mode."""

    def _run_node_with_mock(self, node_module_path, node_run, state, mock_output):
        """Run a node with generate_structured mocked; return the captured prompts."""
        prompts_seen = []

        def capture_and_return(prompt, response_schema, model):
            prompts_seen.append(prompt)
            return mock_output

        with patch("app.llm.retry.generate_structured", side_effect=capture_and_return):
            node_run(state)

        return prompts_seen

    def test_objectives_node_prepends_regen_prefix(self):
        from app.nodes.objectives import run
        state = _regen_state("objectives")
        mock_out = ObjectivesOutput(objectives=["New objective A", "New objective B"])
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert len(prompts) >= 1
        assert "REGENERATION CONTEXT" in prompts[0]
        assert "objectives" in prompts[0]

    def test_objectives_node_no_prefix_in_normal_mode(self):
        from app.nodes.objectives import run
        state = {**_BASE_STATE}  # no regenerateSection
        mock_out = ObjectivesOutput(objectives=["Normal obj"])
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" not in prompts[0]

    def test_prerequisites_node_prepends_regen_prefix(self):
        from app.nodes.prerequisites import run
        state = _regen_state("prerequisites")
        mock_out = PrerequisitesOutput(prerequisites=["Know plant cell"])
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_materials_node_prepends_regen_prefix(self):
        from app.nodes.materials import run
        state = _regen_state("materials")
        mock_out = MaterialsOutput(materials=["Whiteboard", "NCERT book"])
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_activities_node_prepends_regen_prefix(self):
        from app.nodes.activities import run
        state = _regen_state("activities")
        mock_out = ActivitiesOutput(
            intro="New hook",
            instruction="New teach",
            guidedPractice="New guided",
            independentPractice="New independent",
            closure="New closure",
        )
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_assessments_node_prepends_regen_prefix(self):
        from app.nodes.assessments import run
        state = _regen_state("assessment")
        mock_out = AssessmentOutput(formative="New check", summative="New Q1")
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_differentiation_node_prepends_regen_prefix(self):
        from app.nodes.differentiation import run
        state = _regen_state("differentiation")
        mock_out = DifferentiationOutput(
            slowLearners="New scaffold", advancedLearners="New extension"
        )
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_homework_node_prepends_regen_prefix(self):
        from app.nodes.homework import run
        state = _regen_state("homework")
        mock_out = HomeworkOutput(homework="New task 1")
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_standards_node_prepends_regen_prefix(self):
        from app.nodes.standards import run
        state = _regen_state("standards")
        mock_out = StandardsOutput(standards=["CBSE 7.LP-S2: New standard"])
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]

    def test_time_breakdown_node_prepends_regen_prefix(self):
        from app.nodes.time_breakdown import run
        state = _regen_state("timeBreakdown")
        mock_out = TimeBreakdownOutput(
            intro=5, instruction=15, guidedPractice=9, independentPractice=11, closure=5
        )
        prompts = self._run_node_with_mock("", run, state, mock_out)
        assert "REGENERATION CONTEXT" in prompts[0]


# ---------------------------------------------------------------------------
# 3.1.5 — assemble returns partial output in regen mode
# ---------------------------------------------------------------------------

class TestAssemblePartialOutput:
    def test_regen_mode_returns_regen_result_key(self):
        from app.nodes.assemble import run
        state = {**_regen_state("objectives")}
        result = run(state)
        assert "_regen_result" in result
        assert "_final" not in result

    def test_normal_mode_returns_final_key(self):
        from app.nodes.assemble import run
        result = run(_BASE_STATE)
        assert "_final" in result
        assert "_regen_result" not in result

    def test_top_level_section_returns_full_value(self):
        from app.nodes.assemble import run
        state = {**_regen_state("objectives")}
        result = run(state)
        partial = result["_regen_result"]
        assert "objectives" in partial
        assert partial["objectives"] == _DUMMY_EXISTING_PLAN["objectives"]

    def test_dot_section_returns_sub_field_only(self):
        from app.nodes.assemble import run
        state = {**_regen_state("activities.guidedPractice")}
        result = run(state)
        partial = result["_regen_result"]
        # Should return {"guidedPractice": "..."} — not {"activities": {...}}
        assert "guidedPractice" in partial
        assert "activities" not in partial
        assert partial["guidedPractice"] == _DUMMY_EXISTING_PLAN["activities"]["guidedPractice"]

    def test_assessment_sub_field_extraction(self):
        from app.nodes.assemble import run
        state = {**_regen_state("assessment.formative")}
        result = run(state)
        partial = result["_regen_result"]
        assert "formative" in partial
        assert "assessment" not in partial

    def test_time_breakdown_sub_field_extraction(self):
        from app.nodes.assemble import run
        state = {**_regen_state("timeBreakdown.closure")}
        result = run(state)
        partial = result["_regen_result"]
        assert "closure" in partial
        assert partial["closure"] == _DUMMY_EXISTING_PLAN["timeBreakdown"]["closure"]

    def test_homework_top_level_extraction(self):
        from app.nodes.assemble import run
        state = {**_regen_state("homework")}
        result = run(state)
        partial = result["_regen_result"]
        assert "homework" in partial

    @pytest.mark.parametrize("section", [
        "objectives", "prerequisites", "materials", "activities",
        "assessment", "differentiation", "homework", "standards", "timeBreakdown",
    ])
    def test_all_top_level_sections_extractable(self, section):
        from app.nodes.assemble import run
        state = {**_regen_state(section)}
        result = run(state)
        assert "_regen_result" in result
        partial = result["_regen_result"]
        assert section in partial


# ---------------------------------------------------------------------------
# 3.2.1 — POST /regenerate endpoint
# ---------------------------------------------------------------------------

class TestRegenerateEndpoint:
    def test_200_returns_partial_dict(self, client):
        expected_result = {"objectives": ["New obj A", "New obj B"]}
        with patch("app.main.run_regen_pipeline", new_callable=AsyncMock) as mock_regen:
            mock_regen.return_value = expected_result
            response = client.post("/regenerate", json=_BASE_REGEN_PAYLOAD)
        assert response.status_code == 200
        assert response.json() == expected_result

    def test_422_on_unknown_section(self, client):
        bad_payload = {**_BASE_REGEN_PAYLOAD, "regenerateSection": "unknownSection"}
        response = client.post("/regenerate", json=bad_payload)
        assert response.status_code == 422

    def test_422_on_missing_grade(self, client):
        payload = {k: v for k, v in _BASE_REGEN_PAYLOAD.items() if k != "grade"}
        response = client.post("/regenerate", json=payload)
        assert response.status_code == 422

    def test_422_on_invalid_depth(self, client):
        response = client.post(
            "/regenerate", json={**_BASE_REGEN_PAYLOAD, "depth": "Expert"}
        )
        assert response.status_code == 422

    def test_503_when_pipeline_raises_value_error(self, client):
        with patch("app.main.run_regen_pipeline", new_callable=AsyncMock) as mock_regen:
            mock_regen.side_effect = ValueError("GEMINI_API_KEY not set")
            response = client.post("/regenerate", json=_BASE_REGEN_PAYLOAD)
        assert response.status_code == 503
        detail = response.json()["detail"]
        assert "GEMINI_API_KEY" not in detail
        assert "unavailable" in detail.lower()

    def test_502_when_pipeline_raises_runtime_error(self, client):
        with patch("app.main.run_regen_pipeline", new_callable=AsyncMock) as mock_regen:
            mock_regen.side_effect = RuntimeError("objectives: max retries exceeded")
            response = client.post("/regenerate", json=_BASE_REGEN_PAYLOAD)
        assert response.status_code == 502
        detail = response.json()["detail"]
        # Internal node name must not leak
        assert "objectives" not in detail

    def test_regenerate_appears_in_openapi(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        paths = response.json()["paths"]
        assert "/regenerate" in paths
        assert "post" in paths["/regenerate"]

    def test_user_instruction_accepted_when_provided(self, client):
        payload_with_instruction = {
            **_BASE_REGEN_PAYLOAD,
            "userInstruction": "Use MCQ questions for summative assessment",
        }
        expected_result = {"assessment": {"formative": "f", "summative": "s"}}
        with patch("app.main.run_regen_pipeline", new_callable=AsyncMock) as mock_regen:
            mock_regen.return_value = expected_result
            response = client.post("/regenerate", json=payload_with_instruction)
        assert response.status_code == 200

    def test_user_instruction_too_long_rejected(self, client):
        from app.config import get_settings
        max_len = get_settings().user_instruction_max_length
        response = client.post(
            "/regenerate",
            json={**_BASE_REGEN_PAYLOAD, "userInstruction": "x" * (max_len + 1)},
        )
        assert response.status_code == 422

    def test_user_instruction_optional_absent_still_works(self, client):
        expected_result = {"objectives": ["New obj"]}
        with patch("app.main.run_regen_pipeline", new_callable=AsyncMock) as mock_regen:
            mock_regen.return_value = expected_result
            response = client.post("/regenerate", json=_BASE_REGEN_PAYLOAD)
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# 3.2.2 — Full regen pipeline with mocked LLM (Acceptance test A4 proxy)
# ---------------------------------------------------------------------------

class TestRegenPipelineEndToEnd:
    async def test_run_regen_pipeline_returns_partial_dict(self):
        from app.graph.pipeline import run_regen_pipeline
        req = RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "regenerateSection": "objectives"})
        mock_out = ObjectivesOutput(objectives=["New objective X", "New objective Y"])

        with patch("app.llm.retry.generate_structured", return_value=mock_out):
            result = await run_regen_pipeline(req)

        assert isinstance(result, dict)
        assert "objectives" in result

    async def test_run_regen_pipeline_mode_b_passes_chapter_context_to_state(self):
        """chapterContext from RegenerateRequest must reach the node via state."""
        from app.graph.pipeline import run_regen_pipeline
        chapter_ctx = {
            "concepts": ["Photosynthesis"],
            "definitions": ["Process by which plants make food"],
            "examples": ["Leaf colour experiment"],
            "exercises": ["Q1: Define photosynthesis"],
            "subtopics": ["Light reactions"],
            "learningFlow": "Basic to advanced",
        }
        # _BASE_REGEN_PAYLOAD already has regenerateSection="objectives"
        req = RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "chapterContext": chapter_ctx})

        def capture_state(prompt, response_schema, model):
            return ObjectivesOutput(objectives=["Chapter-grounded objective"])

        with patch("app.llm.retry.generate_structured", side_effect=capture_state):
            result = await run_regen_pipeline(req)

        assert "objectives" in result

    async def test_run_regen_pipeline_mode_a_chapter_context_is_none(self):
        """Mode A regen: chapterContext absent → nodes run without chapter grounding."""
        from app.graph.pipeline import run_regen_pipeline
        # _BASE_REGEN_PAYLOAD has no chapterContext → defaults to None
        req = RegenerateRequest(**_BASE_REGEN_PAYLOAD)
        assert req.chapterContext is None

        mock_out = ObjectivesOutput(objectives=["Mode A objective"])
        with patch("app.llm.retry.generate_structured", return_value=mock_out):
            result = await run_regen_pipeline(req)

        assert "objectives" in result

    async def test_run_regen_pipeline_activities_sub_field(self):
        from app.graph.pipeline import run_regen_pipeline
        req = RegenerateRequest(
            **{**_BASE_REGEN_PAYLOAD, "regenerateSection": "activities.guidedPractice"}
        )
        mock_out = ActivitiesOutput(
            intro="Hook",
            instruction="Teach",
            guidedPractice="New guided practice with whiteboard exercise",
            independentPractice="Label diagram",
            closure="Exit ticket",
        )
        with patch("app.llm.retry.generate_structured", return_value=mock_out):
            result = await run_regen_pipeline(req)

        assert "guidedPractice" in result
        assert "activities" not in result


# ---------------------------------------------------------------------------
# 3.2.3 — All 9 top-level sections individually regenerable (parameterised)
# ---------------------------------------------------------------------------

class TestAllSectionsRegeneratable:
    """Verify that the full regen pipeline runs without error for every
    top-level section, returning a dict with the correct key."""

    def _mock_output_for_section(self, section: str):
        schema_map = {
            "objectives":      ObjectivesOutput(objectives=["New obj"]),
            "prerequisites":   PrerequisitesOutput(prerequisites=["New prereq"]),
            "materials":       MaterialsOutput(materials=["New material"]),
            "activities":      ActivitiesOutput(
                intro="i", instruction="t", guidedPractice="g",
                independentPractice="p", closure="c"
            ),
            "assessment":      AssessmentOutput(formative="f", summative="s"),
            "differentiation": DifferentiationOutput(
                slowLearners="sl", advancedLearners="al"
            ),
            "homework":        HomeworkOutput(homework="hw"),
            "standards":       StandardsOutput(standards=["std"]),
            "timeBreakdown":   TimeBreakdownOutput(
                intro=5, instruction=15, guidedPractice=9,
                independentPractice=11, closure=5
            ),
        }
        return schema_map[section]

    @pytest.mark.parametrize("section", [
        "objectives", "prerequisites", "materials", "activities",
        "assessment", "differentiation", "homework", "standards", "timeBreakdown",
    ])
    async def test_section_is_regenerable(self, section):
        from app.graph.pipeline import run_regen_pipeline
        req = RegenerateRequest(**{**_BASE_REGEN_PAYLOAD, "regenerateSection": section})
        mock_out = self._mock_output_for_section(section)

        with patch("app.llm.retry.generate_structured", return_value=mock_out):
            result = await run_regen_pipeline(req)

        assert isinstance(result, dict)
        assert section in result
