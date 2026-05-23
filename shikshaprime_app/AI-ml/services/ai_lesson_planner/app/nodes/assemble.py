import logging

from app.graph.state import LessonPlanState
from app.schemas.outputs import LessonPlan
from app.schemas.sections import (
    ActivitiesOutput,
    AssessmentOutput,
    DifferentiationOutput,
    TimeBreakdownOutput,
)

logger = logging.getLogger(__name__)

# Maps the top-level section name used in regenerateSection to the LessonPlanState
# key that holds the freshly-generated output for that section.
_SECTION_TO_STATE_KEY: dict[str, str] = {
    "objectives":      "objectives",
    "prerequisites":   "prerequisites",
    "materials":       "materials",
    "activities":      "activities",
    "assessment":      "assessment",
    "differentiation": "differentiation",
    "homework":        "homework",
    "standards":       "standards",
    "timeBreakdown":   "timeBreakdown",
}


def run(state: LessonPlanState) -> dict:
    """Assemble section outputs into the final response.

    Normal mode: combines all 9 sections into a validated LessonPlan and
    stores it as _final (returned by run_pipeline / run_pipeline_with_pdf).

    Regeneration mode: when regenerateSection is in state, only the one
    regenerated section is extracted and stored as _regen_result (returned by
    run_regen_pipeline).  The partial dict format matches what the frontend
    uses to patch the corresponding field in its local plan:
      - "activities"             → {"activities": {...}}
      - "activities.guidedPractice" → {"guidedPractice": "..."}
    """
    if regen_section := state.get("regenerateSection"):
        partial = _extract_regen_section(state, regen_section)
        logger.info("assemble node (regen) complete: returning partial section '%s'", regen_section)
        return {"_regen_result": partial}

    plan = LessonPlan(
        objectives=state["objectives"],
        prerequisites=state["prerequisites"],
        materials=state["materials"],
        activities=ActivitiesOutput(**state["activities"]),
        assessment=AssessmentOutput(**state["assessment"]),
        differentiation=DifferentiationOutput(**state["differentiation"]),
        homework=state["homework"],
        standards=state["standards"],
        timeBreakdown=TimeBreakdownOutput(**state["timeBreakdown"]),
    )

    logger.info("assemble node complete — full LessonPlan built and validated")
    return {"_final": plan}


def _extract_regen_section(state: LessonPlanState, section_name: str) -> dict:
    """Return only the regenerated field as a JSON-serializable dict.

    "activities"              → {"activities": {intro: ..., instruction: ..., ...}}
    "activities.guidedPractice" → {"guidedPractice": "..."}
    "objectives"              → {"objectives": [...]}
    "timeBreakdown.intro"     → {"intro": 5}
    """
    parts = section_name.split(".", 1)
    top_key = parts[0]
    state_key = _SECTION_TO_STATE_KEY[top_key]
    value = state.get(state_key)

    if len(parts) == 1:
        return {top_key: value}

    sub_key = parts[1]
    if not isinstance(value, dict):
        return {sub_key: value}
    return {sub_key: value.get(sub_key)}
