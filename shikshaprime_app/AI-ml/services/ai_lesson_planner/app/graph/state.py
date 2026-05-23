from typing import Any, Optional
from typing import TypedDict


class LessonPlanState(TypedDict, total=False):
    """Shared mutable state passed through the LangGraph pipeline.

    total=False makes every field optional so intermediate states (where only
    some nodes have run) are valid TypedDict instances. LangGraph merges the
    dict returned by each node into this state incrementally.
    """

    # --- Request inputs (set once at pipeline entry) ---
    grade: str
    subject: str
    topic: str
    duration: int
    board: str
    teachingStyle: str
    depth: str

    # --- Mode B inputs (None in Mode A) ---
    chapterPdfText: Optional[str]
    # Gemini Files API URI returned after uploading the chapter PDF (Approach 3).
    # Set by the /generate-with-pdf endpoint before pipeline entry; only the
    # chapter_extraction node reads it — all other nodes ignore it.
    geminiFileUri: Optional[str]
    chapterContext: Optional[dict]

    # --- Generated section outputs (filled progressively by nodes) ---
    objectives: list[str]
    prerequisites: list[str]
    materials: list[str]
    activities: dict         # ActivitiesOutput.model_dump()
    assessment: dict         # AssessmentOutput.model_dump()
    differentiation: dict    # DifferentiationOutput.model_dump()
    homework: str
    standards: list[str]
    timeBreakdown: dict      # TimeBreakdownOutput.model_dump()

    # --- Final assembled output (set by assemble node in normal generation mode) ---
    _final: Any              # LessonPlan instance

    # --- Regeneration fields (S3 — set only by POST /regenerate) ---
    # regenerateSection: dotted path of the one section being regenerated,
    #   e.g. "activities.guidedPractice". When present, nodes prepend the
    #   _regen_prefix to their base prompt and assemble returns a partial dict.
    regenerateSection: Optional[str]
    # existingPlan: the full LessonPlan JSON from the previous generation call,
    #   injected into _regen_prefix so the LLM produces a consistent new version.
    existingPlan: Optional[dict]
    # userInstruction: optional free-text from the teacher explaining what they
    #   want changed, e.g. "use MCQ questions" or "make guided practice student-led".
    #   Injected as the highest-priority constraint in the _regen_prefix.
    userInstruction: Optional[str]
    # _regen_result: partial dict returned by assemble in regeneration mode,
    #   e.g. {"guidedPractice": "..."} or {"objectives": [...]}
    _regen_result: Any
