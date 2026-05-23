import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import DifferentiationOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Generate concrete differentiation strategies for slow and advanced learners.

    Reads objectives, activities, and assessment so that strategies are anchored
    to what was actually planned in this lesson, not generic advice.
    In regeneration mode the _regen_prefix is prepended so new strategies
    reference the same activities and assessment already in the plan.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    # teachingStyle is intentionally omitted — differentiation strategies are depth- and
    # objective-driven, not delivery-style-driven. The template has no {teachingStyle}.
    prompt = format_prompt(
        load_prompt("differentiation"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        depth=state["depth"],
        objectives=json.dumps(state["objectives"]),
        activities=json.dumps(state["activities"]),
        assessment=json.dumps(state["assessment"]),
        chapter_block=chapter_block,
        grounding_instruction=grounding_instruction,
    )

    regen_prefix = build_regen_prefix(
        state.get("regenerateSection", ""),
        state.get("existingPlan"),
        state.get("userInstruction"),
    )
    if regen_prefix:
        prompt = regen_prefix + "\n\n" + prompt

    output: DifferentiationOutput = call_with_retry(
        prompt=prompt,
        response_schema=DifferentiationOutput,
        model=_settings.model_name_light,
    )

    logger.info("differentiation node complete")
    return {"differentiation": output.model_dump()}
