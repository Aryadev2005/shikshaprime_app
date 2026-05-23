import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import AssessmentOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Design formative (in-class) and summative (end-of-lesson) assessments.

    duration is passed because the assessments prompt allocates formative and
    summative time as percentages of the total lesson duration (Key Decision 7).
    In regeneration mode the _regen_prefix is prepended so new assessment
    questions still map to the existing objectives.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    # teachingStyle is intentionally omitted — the assessments prompt focuses on
    # objectives and cognitive depth, not delivery style. The template has no {teachingStyle}.
    prompt = format_prompt(
        load_prompt("assessments"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        depth=state["depth"],
        duration=state["duration"],
        objectives=json.dumps(state["objectives"]),
        activities=json.dumps(state["activities"]),
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

    output: AssessmentOutput = call_with_retry(
        prompt=prompt,
        response_schema=AssessmentOutput,
        model=_settings.model_name_heavy,
    )

    logger.info("assessments node complete")
    return {"assessment": output.model_dump()}
