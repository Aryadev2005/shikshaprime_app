import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import StandardsOutput
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Generate 3-5 board-specific curriculum learning outcome standards.

    chapter_block / grounding_instruction are hardcoded to empty strings here —
    curriculum standard codes are board-defined constructs, not derived from
    chapter content. Chapter grounding would bias the codes toward the specific
    textbook rather than the official curriculum framework.
    In regeneration mode the _regen_prefix is prepended so new standards still
    reference the same board and topic as the existing plan.
    """
    prompt = format_prompt(
        load_prompt("standards"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        objectives=json.dumps(state["objectives"]),
        activities=json.dumps(state["activities"]),
        assessment=json.dumps(state["assessment"]),
        chapter_block="",
        grounding_instruction="",
    )

    regen_prefix = build_regen_prefix(
        state.get("regenerateSection", ""),
        state.get("existingPlan"),
        state.get("userInstruction"),
    )
    if regen_prefix:
        prompt = regen_prefix + "\n\n" + prompt

    output: StandardsOutput = call_with_retry(
        prompt=prompt,
        response_schema=StandardsOutput,
        model=_settings.model_name_heavy,
    )

    logger.info("standards node complete: %d standards", len(output.standards))
    return {"standards": output.standards}
