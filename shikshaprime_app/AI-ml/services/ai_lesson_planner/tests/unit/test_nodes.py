"""Unit tests for all LangGraph nodes and the chapter_context utility.

All LLM calls are mocked at app.llm.retry.generate_structured so no real
Gemini API calls are made. Tests verify:
  - Each node returns the correct state key with the correct type
  - Mode B (chapterContext in state) injects CHAPTER CONTEXT into the prompt
  - time_breakdown validates sum == duration and retries on mismatch
  - assemble builds a valid, JSON-serialisable LessonPlan (no mock needed)
  - build_chapter_block returns correct (block, instruction) pairs
"""
from unittest.mock import MagicMock, call, patch

import pytest
from pydantic import BaseModel

from app.graph.state import LessonPlanState
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
from app.utils.chapter_context import build_chapter_block

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

_CHAPTER_CTX = {
    "concepts": ["Photosynthesis"],
    "definitions": ["Process by which plants make food using sunlight"],
    "examples": ["Green leaves absorb sunlight"],
    "exercises": ["Q1: What is the equation for photosynthesis?"],
    "subtopics": ["Light-dependent reactions", "Calvin cycle"],
}

_BASE_STATE: LessonPlanState = {
    "grade": "7",
    "subject": "Science",
    "topic": "Photosynthesis",
    "duration": 45,
    "board": "CBSE",
    "teachingStyle": "Activity-based",
    "depth": "Standard",
    "objectives": ["Define photosynthesis", "Explain the role of chlorophyll"],
    "prerequisites": ["Know that plants need sunlight and water"],
    "materials": ["NCERT Grade 7 Science textbook Ch.1", "Whiteboard"],
    "activities": {
        "intro": "Show a wilting plant and ask what it needs",
        "instruction": "Draw the photosynthesis equation on the board",
        "guidedPractice": "Think-pair-share: what happens in the dark?",
        "independentPractice": "Label a blank chloroplast diagram",
        "closure": "Exit ticket: name one reactant and one product",
    },
    "assessment": {
        "formative": "Thumbs up/down on 3 true/false statements",
        "summative": "Q1: Write the photosynthesis equation. Q2: Why are leaves green?",
    },
    "differentiation": {
        "slowLearners": "Provide a partially filled diagram with reactants labelled",
        "advancedLearners": "Research how CAM plants differ in their photosynthesis",
    },
    "homework": "Task 1: Draw and label the photosynthesis process",
    "standards": ["CBSE Science Grade 7.Life Processes.LP-S1: Define photosynthesis"],
    "timeBreakdown": {
        "intro": 5,
        "instruction": 15,
        "guidedPractice": 9,
        "independentPractice": 11,
        "closure": 5,
    },
}

_PATCH = "app.llm.retry.generate_structured"


def _mode_b_state() -> LessonPlanState:
    return {**_BASE_STATE, "chapterContext": _CHAPTER_CTX}


# ---------------------------------------------------------------------------
# build_chapter_block utility
# ---------------------------------------------------------------------------

class TestBuildChapterBlock:
    def test_mode_a_returns_empty_strings(self) -> None:
        block, instruction = build_chapter_block(None)
        assert block == ""
        assert instruction == ""

    def test_mode_b_returns_populated_block(self) -> None:
        block, instruction = build_chapter_block(_CHAPTER_CTX)
        assert "CHAPTER CONTEXT" in block
        assert "Photosynthesis" in block
        assert "GROUNDING RULE" in instruction

    def test_mode_b_missing_keys_default_to_empty_lists(self) -> None:
        block, _ = build_chapter_block({"concepts": ["A"]})
        assert "[]" in block  # missing lists default to []

    def test_mode_b_block_contains_all_sections(self) -> None:
        block, _ = build_chapter_block(_CHAPTER_CTX)
        for key in ("Concepts", "Definitions", "Examples", "Exercises", "Subtopics"):
            assert key in block


# ---------------------------------------------------------------------------
# Helper to assert Mode B prompt injection
# ---------------------------------------------------------------------------

def _assert_chapter_in_prompt(mock_gen: MagicMock) -> None:
    prompt_sent = mock_gen.call_args.kwargs["prompt"]
    assert "CHAPTER CONTEXT" in prompt_sent, "Mode B must inject CHAPTER CONTEXT into prompt"


# ---------------------------------------------------------------------------
# objectives node
# ---------------------------------------------------------------------------

class TestObjectivesNode:
    from app.nodes import objectives as _mod

    def test_returns_objectives_key_with_list(self) -> None:
        from app.nodes.objectives import run
        dummy = ObjectivesOutput(objectives=["Define X", "Explain Y", "Apply Z"])
        with patch(_PATCH, return_value=dummy):
            result = run(_BASE_STATE)
        assert "objectives" in result
        assert isinstance(result["objectives"], list)
        assert len(result["objectives"]) == 3

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.objectives import run
        dummy = ObjectivesOutput(objectives=["Define X"])
        with patch(_PATCH, return_value=dummy) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)

    def test_mode_a_no_chapter_in_prompt(self) -> None:
        from app.nodes.objectives import run
        dummy = ObjectivesOutput(objectives=["Define X"])
        with patch(_PATCH, return_value=dummy) as mock_gen:
            run(_BASE_STATE)
        prompt = mock_gen.call_args.kwargs["prompt"]
        assert "CHAPTER CONTEXT" not in prompt


# ---------------------------------------------------------------------------
# prerequisites node
# ---------------------------------------------------------------------------

class TestPrerequisitesNode:
    def test_returns_prerequisites_key_with_list(self) -> None:
        from app.nodes.prerequisites import run
        dummy = PrerequisitesOutput(prerequisites=["Know cell structure", "Understand osmosis"])
        with patch(_PATCH, return_value=dummy):
            result = run(_BASE_STATE)
        assert "prerequisites" in result
        assert isinstance(result["prerequisites"], list)

    def test_objectives_appear_in_prompt(self) -> None:
        from app.nodes.prerequisites import run
        dummy = PrerequisitesOutput(prerequisites=["P1"])
        with patch(_PATCH, return_value=dummy) as mock_gen:
            run(_BASE_STATE)
        prompt = mock_gen.call_args.kwargs["prompt"]
        assert "Define photosynthesis" in prompt

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.prerequisites import run
        dummy = PrerequisitesOutput(prerequisites=["P1"])
        with patch(_PATCH, return_value=dummy) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)


# ---------------------------------------------------------------------------
# materials node
# ---------------------------------------------------------------------------

class TestMaterialsNode:
    def test_returns_materials_key_with_list(self) -> None:
        from app.nodes.materials import run
        dummy = MaterialsOutput(materials=["NCERT textbook", "Chart", "Whiteboard"])
        with patch(_PATCH, return_value=dummy):
            result = run(_BASE_STATE)
        assert "materials" in result
        assert isinstance(result["materials"], list)

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.materials import run
        dummy = MaterialsOutput(materials=["M1"])
        with patch(_PATCH, return_value=dummy) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)


# ---------------------------------------------------------------------------
# activities node
# ---------------------------------------------------------------------------

class TestActivitiesNode:
    _DUMMY_ACTIVITIES = ActivitiesOutput(
        intro="Show plant hook",
        instruction="Draw equation on board",
        guidedPractice="Think-pair-share activity",
        independentPractice="Label diagram independently",
        closure="Exit ticket summary",
    )

    def test_returns_activities_key_as_dict(self) -> None:
        from app.nodes.activities import run
        with patch(_PATCH, return_value=self._DUMMY_ACTIVITIES):
            result = run(_BASE_STATE)
        assert "activities" in result
        assert isinstance(result["activities"], dict)
        assert set(result["activities"].keys()) == {
            "intro", "instruction", "guidedPractice", "independentPractice", "closure"
        }

    def test_duration_in_prompt(self) -> None:
        from app.nodes.activities import run
        with patch(_PATCH, return_value=self._DUMMY_ACTIVITIES) as mock_gen:
            run(_BASE_STATE)
        prompt = mock_gen.call_args.kwargs["prompt"]
        assert "45" in prompt

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.activities import run
        with patch(_PATCH, return_value=self._DUMMY_ACTIVITIES) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)


# ---------------------------------------------------------------------------
# assessments node
# ---------------------------------------------------------------------------

class TestAssessmentsNode:
    _DUMMY = AssessmentOutput(
        formative="Thumbs up/down on 3 statements",
        summative="Q1: Write the photosynthesis equation",
    )

    def test_returns_assessment_key_as_dict(self) -> None:
        from app.nodes.assessments import run
        with patch(_PATCH, return_value=self._DUMMY):
            result = run(_BASE_STATE)
        assert "assessment" in result
        assert isinstance(result["assessment"], dict)
        assert "formative" in result["assessment"]
        assert "summative" in result["assessment"]

    def test_duration_in_prompt(self) -> None:
        from app.nodes.assessments import run
        with patch(_PATCH, return_value=self._DUMMY) as mock_gen:
            run(_BASE_STATE)
        prompt = mock_gen.call_args.kwargs["prompt"]
        assert "45" in prompt

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.assessments import run
        with patch(_PATCH, return_value=self._DUMMY) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)


# ---------------------------------------------------------------------------
# differentiation node
# ---------------------------------------------------------------------------

class TestDifferentiationNode:
    _DUMMY = DifferentiationOutput(
        slowLearners="Provide partially filled diagram",
        advancedLearners="Research CAM plant differences",
    )

    def test_returns_differentiation_key_as_dict(self) -> None:
        from app.nodes.differentiation import run
        with patch(_PATCH, return_value=self._DUMMY):
            result = run(_BASE_STATE)
        assert "differentiation" in result
        assert isinstance(result["differentiation"], dict)
        assert "slowLearners" in result["differentiation"]
        assert "advancedLearners" in result["differentiation"]

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.differentiation import run
        with patch(_PATCH, return_value=self._DUMMY) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)


# ---------------------------------------------------------------------------
# homework node
# ---------------------------------------------------------------------------

class TestHomeworkNode:
    _DUMMY = HomeworkOutput(homework="Task 1: Draw the photosynthesis cycle. Task 2: Answer Q3 from textbook p.12.")

    def test_returns_homework_key_as_string(self) -> None:
        from app.nodes.homework import run
        with patch(_PATCH, return_value=self._DUMMY):
            result = run(_BASE_STATE)
        assert "homework" in result
        assert isinstance(result["homework"], str)
        assert len(result["homework"]) > 0

    def test_duration_in_prompt(self) -> None:
        from app.nodes.homework import run
        with patch(_PATCH, return_value=self._DUMMY) as mock_gen:
            run(_BASE_STATE)
        prompt = mock_gen.call_args.kwargs["prompt"]
        assert "45" in prompt

    def test_mode_b_injects_chapter_context(self) -> None:
        from app.nodes.homework import run
        with patch(_PATCH, return_value=self._DUMMY) as mock_gen:
            run(_mode_b_state())
        _assert_chapter_in_prompt(mock_gen)


# ---------------------------------------------------------------------------
# time_breakdown node
# ---------------------------------------------------------------------------

class TestTimeBreakdownNode:
    def _make_output(self, intro=5, instruction=15, guided=9, independent=11, closure=5) -> TimeBreakdownOutput:
        return TimeBreakdownOutput(
            intro=intro,
            instruction=instruction,
            guidedPractice=guided,
            independentPractice=independent,
            closure=closure,
        )

    def test_valid_sum_returns_time_breakdown(self) -> None:
        from app.nodes.time_breakdown import run
        # 5+15+9+11+5 = 45 == duration
        dummy = self._make_output()
        with patch(_PATCH, return_value=dummy):
            result = run(_BASE_STATE)
        assert "timeBreakdown" in result
        assert isinstance(result["timeBreakdown"], dict)
        total = sum(result["timeBreakdown"].values())
        assert total == 45

    def test_invalid_sum_raises_runtime_error(self) -> None:
        from app.nodes.time_breakdown import run
        # 5+15+9+11+4 = 44 != 45 on all attempts
        dummy = self._make_output(closure=4)
        with patch(_PATCH, return_value=dummy):
            with pytest.raises(RuntimeError, match="time_breakdown"):
                run(_BASE_STATE)

    def test_invalid_sum_retries_correct_number_of_times(self) -> None:
        from app.nodes.time_breakdown import run
        from app.config import get_settings
        max_retries = get_settings().llm_max_retries  # default 2
        dummy = self._make_output(closure=4)  # wrong sum every time
        with patch(_PATCH, return_value=dummy) as mock_gen:
            with pytest.raises(RuntimeError):
                run(_BASE_STATE)
        # outer loop runs (max_retries + 1) times; each calls generate_structured once
        assert mock_gen.call_count == max_retries + 1

    def test_succeeds_on_second_attempt_after_sum_fix(self) -> None:
        from app.nodes.time_breakdown import run
        bad = self._make_output(closure=4)   # sum=44
        good = self._make_output(closure=5)  # sum=45
        side_effects = [bad, good]
        with patch(_PATCH, side_effect=side_effects):
            result = run(_BASE_STATE)
        assert result["timeBreakdown"]["closure"] == 5

    def test_augmented_prompt_on_retry(self) -> None:
        from app.nodes.time_breakdown import run
        bad = self._make_output(closure=4)
        good = self._make_output(closure=5)
        with patch(_PATCH, side_effect=[bad, good]) as mock_gen:
            run(_BASE_STATE)
        # Second call's prompt should mention the sum mismatch
        second_call_prompt = mock_gen.call_args_list[1].kwargs["prompt"]
        assert "SUM VALIDATION FAILED" in second_call_prompt or "44" in second_call_prompt


# ---------------------------------------------------------------------------
# standards node
# ---------------------------------------------------------------------------

class TestStandardsNode:
    _DUMMY = StandardsOutput(standards=[
        "CBSE Science Grade 7.Life Processes.LP-S1: Define photosynthesis",
        "CBSE Science Grade 7.Life Processes.LP-S2: Explain the role of chlorophyll",
    ])

    def test_returns_standards_key_with_list(self) -> None:
        from app.nodes.standards import run
        with patch(_PATCH, return_value=self._DUMMY):
            result = run(_BASE_STATE)
        assert "standards" in result
        assert isinstance(result["standards"], list)
        assert len(result["standards"]) == 2

    def test_mode_b_prompt_unchanged_for_standards(self) -> None:
        """standards node always passes empty chapter_block (no grounding needed)."""
        from app.nodes.standards import run
        with patch(_PATCH, return_value=self._DUMMY) as mock_gen:
            run(_mode_b_state())
        # chapter_block is always empty for standards — CHAPTER CONTEXT must NOT appear
        prompt = mock_gen.call_args.kwargs["prompt"]
        assert "CHAPTER CONTEXT" not in prompt


# ---------------------------------------------------------------------------
# assemble node (no LLM mock needed)
# ---------------------------------------------------------------------------

class TestAssembleNode:
    def test_returns_final_key_with_lesson_plan(self) -> None:
        from app.nodes.assemble import run
        from app.schemas.outputs import LessonPlan
        result = run(_BASE_STATE)
        assert "_final" in result
        assert isinstance(result["_final"], LessonPlan)

    def test_lesson_plan_json_serialisable(self) -> None:
        from app.nodes.assemble import run
        result = run(_BASE_STATE)
        json_str = result["_final"].model_dump_json()
        assert '"objectives"' in json_str
        assert '"activities"' in json_str
        assert '"timeBreakdown"' in json_str

    def test_lesson_plan_contains_all_sections(self) -> None:
        from app.nodes.assemble import run
        result = run(_BASE_STATE)
        plan_dict = result["_final"].model_dump()
        required = {
            "objectives", "prerequisites", "materials",
            "activities", "assessment", "differentiation",
            "homework", "standards", "timeBreakdown",
        }
        assert required.issubset(plan_dict.keys())

    def test_time_breakdown_values_preserved(self) -> None:
        from app.nodes.assemble import run
        result = run(_BASE_STATE)
        tb = result["_final"].model_dump()["timeBreakdown"]
        assert tb["intro"] == 5
        assert tb["instruction"] == 15
