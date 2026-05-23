import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import ObjectivesOutput
from app.utils.chapter_context import build_chapter_block
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Generate 4-6 Bloom's-aligned learning objectives.

    First node in the pipeline — no upstream context needed.
    In regeneration mode the _regen_prefix is prepended so the LLM produces a
    different version that is consistent with the unchanged sections.
    """
    chapter_block, grounding_instruction = build_chapter_block(state.get("chapterContext"))

    prompt = format_prompt(
        load_prompt("objectives"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
        teachingStyle=state["teachingStyle"],
        depth=state["depth"],
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

    output: ObjectivesOutput = call_with_retry(
        prompt=prompt,
        response_schema=ObjectivesOutput,
        model=_settings.model_name_heavy,
    )

    logger.info("objectives node complete: %d objectives generated", len(output.objectives))
    return {"objectives": output.objectives}
