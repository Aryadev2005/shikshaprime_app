import asyncio

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.nodes import (
    activities,
    assessments,
    assemble,
    chapter_extraction,
    differentiation,
    homework,
    materials,
    objectives,
    prerequisites,
    standards,
    time_breakdown,
)
from app.schemas.inputs import GenerateRequest, RegenerateRequest
from app.schemas.outputs import LessonPlan
from app.utils.text_chapter_extractor import extract_chapter_from_text

# ---------------------------------------------------------------------------
# Section → node name mapping (used by the regeneration graph router).
# The LessonPlan field names (objectives, assessment, timeBreakdown, …) are the
# keys; the LangGraph node names are the values.  Centralised here so both the
# routing function and run_regen_pipeline share a single source of truth.
# ---------------------------------------------------------------------------
_SECTION_TO_NODE: dict[str, str] = {
    "objectives":      "objectives",
    "prerequisites":   "prerequisites",
    "materials":       "materials",
    "activities":      "activities",
    "assessment":      "assessments",      # state key = "assessment", node = "assessments"
    "differentiation": "differentiation",
    "homework":        "homework",
    "standards":       "standards",
    "timeBreakdown":   "time_breakdown",   # state key = "timeBreakdown", node = "time_breakdown"
}


# ---------------------------------------------------------------------------
# Generation pipeline (Mode A / Mode B)
# ---------------------------------------------------------------------------

def _entry_route(state: LessonPlanState) -> str:
    """Route to chapter_extraction when a Gemini file URI is present (Mode B), else to objectives (Mode A)."""
    return "chapter_extraction" if state.get("geminiFileUri") else "objectives"


def build_graph() -> CompiledStateGraph:
    """Build and compile the LangGraph pipeline supporting Mode A and Mode B.

    Mode A (no PDF): START → objectives → ... → assemble → END
    Mode B (PDF):    START → chapter_extraction → objectives → ... → assemble → END

    The conditional entry edge (_entry_route) selects the path based on whether
    geminiFileUri is populated in the initial state. All 9 generation nodes are
    shared between both modes — they switch behaviour via chapterContext being
    set or absent (handled by build_chapter_block in each node).
    """
    g = StateGraph(LessonPlanState)

    g.add_node("chapter_extraction", chapter_extraction.run)
    g.add_node("objectives", objectives.run)
    g.add_node("prerequisites", prerequisites.run)
    g.add_node("materials", materials.run)
    g.add_node("activities", activities.run)
    g.add_node("assessments", assessments.run)
    g.add_node("differentiation", differentiation.run)
    g.add_node("homework", homework.run)
    g.add_node("time_breakdown", time_breakdown.run)
    g.add_node("standards", standards.run)
    g.add_node("assemble", assemble.run)

    # Conditional entry: Mode B routes through chapter_extraction first
    g.add_conditional_edges(
        START,
        _entry_route,
        {"chapter_extraction": "chapter_extraction", "objectives": "objectives"},
    )
    g.add_edge("chapter_extraction", "objectives")

    # Linear chain shared by both modes
    g.add_edge("objectives", "prerequisites")
    g.add_edge("prerequisites", "materials")
    g.add_edge("materials", "activities")
    g.add_edge("activities", "assessments")
    g.add_edge("assessments", "differentiation")
    g.add_edge("differentiation", "homework")
    g.add_edge("homework", "time_breakdown")
    g.add_edge("time_breakdown", "standards")
    g.add_edge("standards", "assemble")
    g.add_edge("assemble", END)

    return g.compile()


# ---------------------------------------------------------------------------
# Regeneration pipeline (S3)
# ---------------------------------------------------------------------------

def _regen_entry_route(state: LessonPlanState) -> str:
    """Route to the single node responsible for the requested section.

    Extracts the top-level key from a potentially dotted section path:
      "activities.guidedPractice" → top_key "activities" → node "activities"
      "assessment.formative"      → top_key "assessment"  → node "assessments"
    """
    section: str = state["regenerateSection"]  # type: ignore[index]
    top_key = section.split(".")[0]
    return _SECTION_TO_NODE[top_key]


def build_regen_graph() -> CompiledStateGraph:
    """Build and compile the regeneration pipeline.

    Star topology: START → [one of 9 nodes via _regen_entry_route] → assemble → END

    The conditional entry routes to exactly ONE generation node based on
    regenerateSection.  That node has its _regen_prefix prepended (done inside
    the node itself) so it produces a different-but-consistent output.  Assemble
    detects regenerateSection and returns a partial dict instead of a full plan.
    """
    g = StateGraph(LessonPlanState)

    g.add_node("objectives", objectives.run)
    g.add_node("prerequisites", prerequisites.run)
    g.add_node("materials", materials.run)
    g.add_node("activities", activities.run)
    g.add_node("assessments", assessments.run)
    g.add_node("differentiation", differentiation.run)
    g.add_node("homework", homework.run)
    g.add_node("time_breakdown", time_breakdown.run)
    g.add_node("standards", standards.run)
    g.add_node("assemble", assemble.run)

    # Conditional entry: route to exactly the one requested node
    g.add_conditional_edges(
        START,
        _regen_entry_route,
        {node: node for node in _SECTION_TO_NODE.values()},
    )

    # Each generation node connects directly to assemble — skip the linear chain
    for node_name in _SECTION_TO_NODE.values():
        g.add_edge(node_name, "assemble")

    g.add_edge("assemble", END)

    return g.compile()


# ---------------------------------------------------------------------------
# Module-level compiled graphs — compiled once at import, reused per request
# ---------------------------------------------------------------------------

_graph = build_graph()
_regen_graph = build_regen_graph()
_settings = get_settings()


# ---------------------------------------------------------------------------
# Public pipeline runners
# ---------------------------------------------------------------------------

async def run_pipeline(req: GenerateRequest) -> LessonPlan:
    """Run the generation pipeline from a validated GenerateRequest.

    Supports two paths:

    Mode A (topic-only) — req.chapterPdfText is None:
        initial_state has no chapterContext → _entry_route sends directly to
        objectives → all 9 nodes run without chapter grounding.

    Mode B text (boss's spec) — req.chapterPdfText is provided:
        extract_chapter_from_text() calls Gemini to parse the raw text into a
        structured ChapterContext dict.  That dict is stored in
        initial_state["chapterContext"] before the pipeline starts, so all 9
        generation nodes receive chapter grounding via build_chapter_block()
        exactly as they do in Mode B PDF.  _entry_route still sends to
        objectives (not chapter_extraction) because extraction is already done.

    Raises:
        RuntimeError: if any node fails after all retries, or if timeout exceeded.
        ValueError:   if GEMINI_API_KEY is not set.
    """
    initial_state: LessonPlanState = req.model_dump()

    if req.chapterPdfText:
        chapter_context = extract_chapter_from_text(
            text=req.chapterPdfText,
            grade=req.grade,
            subject=req.subject,
            topic=req.topic,
            board=req.board,
        )
        initial_state["chapterContext"] = chapter_context

    return await _invoke_with_timeout(initial_state)


async def run_pipeline_with_pdf(initial_state: LessonPlanState) -> LessonPlan:
    """Run the Mode B pipeline from a pre-built state that includes geminiFileUri.

    The caller (generate_with_pdf endpoint) is responsible for uploading the PDF
    and populating geminiFileUri before calling this function. _entry_route detects
    the URI and routes through chapter_extraction before the generation chain.

    Raises:
        RuntimeError: if any node fails after all retries, or if timeout exceeded.
        ValueError:   if GEMINI_API_KEY is not set.
    """
    return await _invoke_with_timeout(initial_state)


async def run_regen_pipeline(req: RegenerateRequest) -> dict:
    """Run the regeneration pipeline from a validated RegenerateRequest.

    Builds the full LessonPlanState by:
    1. Populating original input params (grade, subject, topic, …) from req
       so every node can format its base prompt.
    2. Pre-filling all 9 section outputs from existingPlan so each node has
       upstream context (e.g. activities node can see existing objectives).
    3. Setting regenerateSection + existingPlan so nodes prepend _regen_prefix
       and assemble returns a partial dict.

    Returns:
        A partial dict with only the regenerated field(s), e.g.:
          {"guidedPractice": "..."} for "activities.guidedPractice"
          {"objectives": [...]}     for "objectives"

    Raises:
        RuntimeError: if the target node fails after all retries, or timeout exceeded.
        ValueError:   if GEMINI_API_KEY is not set.
    """
    existing = req.existingPlan
    activities_val = existing.get("activities", {})

    initial_state: LessonPlanState = {
        # Original generation parameters — needed by node prompt templates
        "grade":         req.grade,
        "subject":       req.subject,
        "topic":         req.topic,
        "duration":      req.duration,
        "board":         req.board,
        "teachingStyle": req.teachingStyle,
        "depth":         req.depth,

        # Regeneration control fields
        "regenerateSection": req.regenerateSection,
        "existingPlan":      existing,
        "userInstruction":   req.userInstruction,

        # Mode B chapter grounding — if the original plan was generated with a
        # PDF chapter, the frontend passes chapterContext back here so the
        # regenerated section stays grounded in the same textbook content.
        # None in Mode A (no PDF) → build_chapter_block returns ("", "") → no grounding.
        "chapterContext":   req.chapterContext,

        # Pre-fill section outputs from existingPlan — upstream context for the
        # regenerated node (e.g. activities.run() still reads objectives from state)
        "objectives":      existing.get("objectives", []),
        "prerequisites":   existing.get("prerequisites", []),
        "materials":       existing.get("materials", []),
        "activities":      activities_val if isinstance(activities_val, dict) else {},
        "assessment":      existing.get("assessment", {}),
        "differentiation": existing.get("differentiation", {}),
        "homework":        existing.get("homework", ""),
        "standards":       existing.get("standards", []),
        "timeBreakdown":   existing.get("timeBreakdown", {}),
    }

    try:
        result = await asyncio.wait_for(
            _regen_graph.ainvoke(initial_state),
            timeout=_settings.pipeline_timeout_seconds,
        )
    except asyncio.TimeoutError:
        raise RuntimeError(
            f"Regen pipeline timed out after {_settings.pipeline_timeout_seconds}s"
        )

    return result["_regen_result"]


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

async def _invoke_with_timeout(initial_state: LessonPlanState) -> LessonPlan:
    """Shared ainvoke wrapper with pipeline-level timeout.

    Wraps ainvoke with asyncio.wait_for to cap total execution time at
    PIPELINE_TIMEOUT_SECONDS. A timeout raises RuntimeError which the caller
    converts to HTTP 502 — preventing a hanging Gemini call from exhausting workers.
    """
    try:
        result = await asyncio.wait_for(
            _graph.ainvoke(initial_state),
            timeout=_settings.pipeline_timeout_seconds,
        )
    except asyncio.TimeoutError:
        raise RuntimeError(
            f"Pipeline timed out after {_settings.pipeline_timeout_seconds}s"
        )
    return result["_final"]
