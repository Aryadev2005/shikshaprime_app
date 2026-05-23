"""Tests for Pydantic schema validation (inputs, sections, outputs)."""
import pytest
from pydantic import ValidationError

from app.schemas.inputs import GenerateRequest, RegenerateRequest
from app.schemas.sections import (
    ObjectivesOutput,
    PrerequisitesOutput,
    MaterialsOutput,
    ActivitiesOutput,
    AssessmentOutput,
    DifferentiationOutput,
    HomeworkOutput,
    StandardsOutput,
    TimeBreakdownOutput,
    ChapterContext,
)
from app.schemas.outputs import LessonPlan


class TestGenerateRequest:
    def test_valid_mode_a(self) -> None:
        req = GenerateRequest(
            grade="7", subject="Science", topic="Photosynthesis",
            duration=45, board="CBSE", teachingStyle="Activity-based",
            depth="Standard",
        )
        assert req.has_chapter is False
        assert req.chapterPdfText is None
        assert req.duration == 45

    def test_valid_mode_b(self) -> None:
        req = GenerateRequest(
            grade="7", subject="Science", topic="Photosynthesis",
            duration=45, board="CBSE", teachingStyle="Activity-based",
            depth="Standard", chapterPdfText="x" * 60,
        )
        assert req.has_chapter is True
        assert len(req.chapterPdfText) == 60

    def test_duration_zero_rejected(self) -> None:
        with pytest.raises(ValidationError):
            GenerateRequest(
                grade="7", subject="Science", topic="T",
                duration=0, board="CBSE", teachingStyle="A", depth="Basic",
            )

    def test_duration_exceeds_max_rejected(self) -> None:
        with pytest.raises(ValidationError):
            GenerateRequest(
                grade="7", subject="Science", topic="T",
                duration=999, board="CBSE", teachingStyle="A", depth="Basic",
            )

    def test_chapter_text_too_short_rejected(self) -> None:
        with pytest.raises(ValidationError):
            GenerateRequest(
                grade="7", subject="Science", topic="T",
                duration=45, board="CBSE", teachingStyle="A",
                depth="Basic", chapterPdfText="short",
            )

    def test_chapter_text_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            GenerateRequest(
                grade="7", subject="Science", topic="T",
                duration=45, board="CBSE", teachingStyle="A",
                depth="Basic", chapterPdfText="x" * 60000,
            )


_REGEN_BASE = dict(
    grade="7", subject="Science", topic="Photosynthesis",
    duration=45, board="CBSE", teachingStyle="Activity-based", depth="Standard",
    existingPlan={"objectives": ["Define photosynthesis"]},
)


class TestRegenerateRequest:
    def test_valid(self) -> None:
        req = RegenerateRequest(
            **_REGEN_BASE,
            regenerateSection="activities.guidedPractice",
        )
        assert req.regenerateSection == "activities.guidedPractice"
        assert req.grade == "7"

    def test_invalid_section_path_rejected(self) -> None:
        with pytest.raises(ValidationError):
            RegenerateRequest(
                **_REGEN_BASE,
                regenerateSection="activities/guidedPractice",
            )

    def test_unknown_section_rejected(self) -> None:
        with pytest.raises(ValidationError, match="not a valid regenerateSection"):
            RegenerateRequest(
                **_REGEN_BASE,
                regenerateSection="unknownSection",
            )

    def test_valid_section_path_accepted(self) -> None:
        req = RegenerateRequest(
            **_REGEN_BASE,
            regenerateSection="objectives",
        )
        assert req.regenerateSection == "objectives"

    def test_missing_grade_rejected(self) -> None:
        payload = {k: v for k, v in _REGEN_BASE.items() if k != "grade"}
        with pytest.raises(ValidationError):
            RegenerateRequest(**payload, regenerateSection="objectives")

    def test_chapter_context_none_by_default(self) -> None:
        req = RegenerateRequest(**_REGEN_BASE, regenerateSection="objectives")
        assert req.chapterContext is None

    def test_chapter_context_accepted_for_mode_b(self) -> None:
        req = RegenerateRequest(
            **_REGEN_BASE,
            regenerateSection="objectives",
            chapterContext={
                "concepts": ["Photosynthesis"],
                "definitions": ["..."],
                "examples": [],
                "exercises": [],
                "subtopics": [],
            },
        )
        assert req.chapterContext is not None
        assert req.chapterContext["concepts"] == ["Photosynthesis"]


class TestSectionOutputs:
    def test_objectives_output(self) -> None:
        obj = ObjectivesOutput(objectives=["Define", "Explain", "Apply"])
        assert len(obj.objectives) == 3

    def test_prerequisites_output(self) -> None:
        p = PrerequisitesOutput(prerequisites=["Algebra basics", "Graph reading"])
        assert len(p.prerequisites) == 2

    def test_materials_output(self) -> None:
        m = MaterialsOutput(materials=["Whiteboard", "Projector"])
        assert len(m.materials) == 2

    def test_activities_output(self) -> None:
        a = ActivitiesOutput(
            intro="Hook", instruction="Teach", guidedPractice="Practice",
            independentPractice="Work", closure="Recap",
        )
        assert a.intro == "Hook"
        assert a.closure == "Recap"

    def test_assessment_output(self) -> None:
        a = AssessmentOutput(formative="Quick quiz", summative="Unit test")
        assert a.formative == "Quick quiz"

    def test_differentiation_output(self) -> None:
        d = DifferentiationOutput(
            slowLearners="Extra worksheets",
            advancedLearners="Extension problems",
        )
        assert d.slowLearners == "Extra worksheets"

    def test_homework_output(self) -> None:
        h = HomeworkOutput(homework="Worksheet page 10")
        assert h.homework == "Worksheet page 10"

    def test_standards_output(self) -> None:
        s = StandardsOutput(standards=["CBSE 7.1.1", "CBSE 7.1.2"])
        assert len(s.standards) == 2

    def test_time_breakdown_output(self) -> None:
        t = TimeBreakdownOutput(
            intro=5, instruction=15, guidedPractice=10,
            independentPractice=10, closure=5,
        )
        total = t.intro + t.instruction + t.guidedPractice + t.independentPractice + t.closure
        assert total == 45

    def test_time_breakdown_zero_rejected(self) -> None:
        with pytest.raises(ValidationError):
            TimeBreakdownOutput(
                intro=0, instruction=15, guidedPractice=10,
                independentPractice=10, closure=5,
            )

    def test_chapter_context(self) -> None:
        ctx = ChapterContext(
            concepts=["Photosynthesis"],
            definitions=["Process by which plants make food"],
            examples=["Example 1"],
            exercises=["Q1: What is photosynthesis?"],
            subtopics=["Light reaction", "Dark reaction"],
            learningFlow="From basic to advanced",
        )
        assert len(ctx.concepts) == 1
        assert ctx.learningFlow == "From basic to advanced"

    def test_chapter_context_minimal(self) -> None:
        ctx = ChapterContext(
            concepts=[], definitions=[], examples=[],
            exercises=[], subtopics=[],
        )
        assert ctx.learningFlow is None


class TestLessonPlan:
    def test_valid_plan(self) -> None:
        plan = LessonPlan(
            objectives=["Define photosynthesis"],
            prerequisites=["Plant knowledge"],
            materials=["Whiteboard"],
            activities=ActivitiesOutput(
                intro="Hook", instruction="Teach", guidedPractice="Practice",
                independentPractice="Work", closure="Recap",
            ),
            assessment=AssessmentOutput(formative="Quiz", summative="Test"),
            differentiation=DifferentiationOutput(
                slowLearners="Simplify", advancedLearners="Extend",
            ),
            homework="Worksheet",
            standards=["CBSE 7.1"],
            timeBreakdown=TimeBreakdownOutput(
                intro=5, instruction=15, guidedPractice=10,
                independentPractice=10, closure=5,
            ),
        )
        data = plan.model_dump()
        assert data["objectives"] == ["Define photosynthesis"]
        assert data["activities"]["intro"] == "Hook"
        assert data["timeBreakdown"]["intro"] == 5

    def test_plan_model_dump_json(self) -> None:
        plan = LessonPlan(
            objectives=["O1"], prerequisites=["P1"], materials=["M1"],
            activities=ActivitiesOutput(
                intro="I", instruction="I", guidedPractice="G",
                independentPractice="I", closure="C",
            ),
            assessment=AssessmentOutput(formative="F", summative="S"),
            differentiation=DifferentiationOutput(
                slowLearners="SL", advancedLearners="AL",
            ),
            homework="H", standards=["S1"],
            timeBreakdown=TimeBreakdownOutput(
                intro=1, instruction=1, guidedPractice=1,
                independentPractice=1, closure=1,
            ),
        )
        json_str = plan.model_dump_json()
        assert '"objectives"' in json_str
        assert '"activities"' in json_str
        assert '"timeBreakdown"' in json_str
