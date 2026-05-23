import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import MaterialsOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """List 5-8 classroom materials matched to teaching style and depth.

    Upstream context: objectives + prerequisites — gives the LLM enough
    information to choose materials that serve the specific learning goals.
    In regeneration mode the _regen_prefix is prepended so the new materials
    list stays consistent with the existing activities and objectives.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    prompt = format_prompt(
        load_prompt("materials"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        teachingStyle=state["teachingStyle"],
        depth=state["depth"],
        objectives=json.dumps(state["objectives"]),
        prerequisites=json.dumps(state["prerequisites"]),
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

    output: MaterialsOutput = call_with_retry(
        prompt=prompt,
        response_schema=MaterialsOutput,
        model=_settings.model_name_light,
    )

    logger.info("materials node complete: %d items", len(output.materials))
    return {"materials": output.materials}
