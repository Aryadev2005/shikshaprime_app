from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.config import get_settings

_settings = get_settings()

# All valid regenerateSection values — top-level sections and their sub-fields.
# Validated at schema level so the regen pipeline never receives an unknown path.
_ALLOWED_REGEN_SECTIONS: frozenset[str] = frozenset({
    "objectives",
    "prerequisites",
    "materials",
    "activities",
    "activities.intro",
    "activities.instruction",
    "activities.guidedPractice",
    "activities.independentPractice",
    "activities.closure",
    "assessment",
    "assessment.formative",
    "assessment.summative",
    "differentiation",
    "differentiation.slowLearners",
    "differentiation.advancedLearners",
    "homework",
    "standards",
    "timeBreakdown",
    "timeBreakdown.intro",
    "timeBreakdown.instruction",
    "timeBreakdown.guidedPractice",
    "timeBreakdown.independentPractice",
    "timeBreakdown.closure",
})


class GenerateRequest(BaseModel):
    grade: str = Field(max_length=100, description="Grade level, e.g. '7', '10'")
    subject: str = Field(max_length=200, description="Subject name, e.g. 'Science', 'Mathematics'")
    topic: str = Field(max_length=500, description="Lesson topic, e.g. 'Photosynthesis', 'Quadratic Equations'")
    duration: int = Field(gt=0, le=_settings.max_lesson_duration, description="Lesson duration in minutes")
    board: str = Field(max_length=50, description="Curriculum board: CBSE, ICSE, State, IB")
    teachingStyle: str = Field(max_length=200, description="Preferred teaching style, e.g. 'Activity-based', 'Lecture-based'")
    depth: Literal["Basic", "Standard", "Advanced"] = Field(description="Depth level: Basic, Standard, or Advanced")
    chapterPdfText: Optional[str] = Field(
        default=None,
        min_length=_settings.chapter_text_min_length,
        max_length=_settings.chapter_text_max_length,
        description="Extracted chapter PDF text for Mode B generation",
    )

    @property
    def has_chapter(self) -> bool:
        return bool(self.chapterPdfText)


class RegenerateRequest(BaseModel):
    # --- Section to regenerate ---
    regenerateSection: str = Field(
        pattern=r'^[a-zA-Z.]+$',
        description=(
            "Dotted path of the section to regenerate. "
            "Top-level: objectives | prerequisites | materials | activities | "
            "assessment | differentiation | homework | standards | timeBreakdown. "
            "Sub-field examples: activities.guidedPractice, assessment.summative."
        ),
    )

    # --- Original generation parameters ---
    # Required so nodes can format their base prompts (grade, subject, topic, etc.
    # are referenced by every node prompt template). The regen prefix is prepended
    # ON TOP of the base prompt, not instead of it.
    grade: str = Field(max_length=100, description="Grade level from the original generation request")
    subject: str = Field(max_length=200, description="Subject from the original generation request")
    topic: str = Field(max_length=500, description="Topic from the original generation request")
    duration: int = Field(gt=0, le=_settings.max_lesson_duration, description="Duration from the original request")
    board: str = Field(max_length=50, description="Curriculum board from the original request")
    teachingStyle: str = Field(max_length=200, description="Teaching style from the original request")
    depth: Literal["Basic", "Standard", "Advanced"] = Field(description="Depth level from the original request")

    # --- Existing plan ---
    existingPlan: dict = Field(description="The full existing LessonPlan JSON used as read-only context")

    # --- Mode B chapter grounding (optional) ---
    # When the original plan was generated via POST /generate-with-pdf (Mode B),
    # the frontend must pass back the chapterContext dict that came from the
    # chapter_extraction node.  This lets the regenerated section stay grounded
    # in the same textbook chapter — e.g. activities still reference chapter
    # exercises, assessments still use chapter questions.
    # For Mode A plans (no PDF), leave this null — regeneration runs without grounding.
    chapterContext: Optional[dict] = Field(
        default=None,
        description=(
            "ChapterContext dict from the original Mode B generation "
            "(keys: concepts, definitions, examples, exercises, subtopics, learningFlow). "
            "Pass null for Mode A plans."
        ),
    )

    # --- Teacher's specific instruction (optional) ---
    # Free-text note from the teacher explaining WHY they want a different version
    # and WHAT they specifically want changed, e.g.:
    #   "Make the guided practice more student-led, not teacher-driven"
    #   "Use MCQ questions for summative assessment, not written answers"
    #   "The objectives need to be simpler — this is a Basic depth lesson"
    # Injected into _regen_prefix as the highest-priority constraint.
    # When absent, the AI regenerates freely (different but consistent).
    userInstruction: Optional[str] = Field(
        default=None,
        max_length=_settings.user_instruction_max_length,
        description=(
            "Optional free-text instruction from the teacher explaining what to change, "
            "e.g. 'make the guided practice more student-led'. "
            f"Max {_settings.user_instruction_max_length} characters."
        ),
    )

    @field_validator("regenerateSection")
    @classmethod
    def validate_section_in_allow_list(cls, v: str) -> str:
        if v not in _ALLOWED_REGEN_SECTIONS:
            allowed = ", ".join(sorted(_ALLOWED_REGEN_SECTIONS))
            raise ValueError(
                f"'{v}' is not a valid regenerateSection. "
                f"Allowed values: {allowed}"
            )
        return v
