import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import HomeworkOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Write 2-3 specific homework tasks that extend (not repeat) the lesson.

    duration is passed because the homework prompt scales task time as a
    fraction of the lesson duration rather than using hardcoded minutes
    (Key Decision 7). All upstream context is included so homework avoids
    duplicating what was already done in class.
    In regeneration mode the _regen_prefix is prepended so new homework tasks
    extend (not repeat) the same activities already in the plan.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    # teachingStyle is intentionally omitted — homework extends learning regardless of
    # in-class delivery style. The template has no {teachingStyle}.
    prompt = format_prompt(
        load_prompt("homework"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        depth=state["depth"],
        duration=state["duration"],
        objectives=json.dumps(state["objectives"]),
        activities=json.dumps(state["activities"]),
        assessment=json.dumps(state["assessment"]),
        differentiation=json.dumps(state["differentiation"]),
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

    output: HomeworkOutput = call_with_retry(
        prompt=prompt,
        response_schema=HomeworkOutput,
        model=_settings.model_name_light,
    )

    logger.info("homework node complete")
    return {"homework": output.homework}
