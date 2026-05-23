import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import ActivitiesOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Generate detailed teacher-facing instructions for 5 lesson phases.

    The most complex node — uses all upstream context (objectives, prerequisites,
    materials) plus duration. Uses the HEAVY model because activities output
    quality is the primary determinant of lesson plan usefulness.
    In regeneration mode the _regen_prefix is prepended so the new activities
    follow the same learning flow as the existing assessments and objectives.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    prompt = format_prompt(
        load_prompt("activities"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        teachingStyle=state["teachingStyle"],
        depth=state["depth"],
        duration=state["duration"],
        objectives=json.dumps(state["objectives"]),
        prerequisites=json.dumps(state["prerequisites"]),
        materials=json.dumps(state["materials"]),
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

    output: ActivitiesOutput = call_with_retry(
        prompt=prompt,
        response_schema=ActivitiesOutput,
        model=_settings.model_name_heavy,
    )

    logger.info("activities node complete: all 5 phases generated")
    return {"activities": output.model_dump()}
