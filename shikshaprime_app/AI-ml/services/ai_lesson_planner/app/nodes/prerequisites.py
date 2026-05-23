import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import PrerequisitesOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Identify 3-5 specific prerequisite knowledge items.

    Upstream context: objectives — passed as JSON so the LLM can align
    prerequisites directly to what students will need to achieve.
    In regeneration mode the _regen_prefix is prepended to produce a
    different but consistent set of prerequisites.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    prompt = format_prompt(
        load_prompt("prerequisites"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        teachingStyle=state["teachingStyle"],
        depth=state["depth"],
        objectives=json.dumps(state["objectives"]),
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

    output: PrerequisitesOutput = call_with_retry(
        prompt=prompt,
        response_schema=PrerequisitesOutput,
        model=_settings.model_name_light,
    )

    logger.info("prerequisites node complete: %d items", len(output.prerequisites))
    return {"prerequisites": output.prerequisites}
