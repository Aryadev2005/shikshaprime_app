import json
import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry
from app.schemas.sections import TimeBreakdownOutput
from app.utils.prompt_loader import format_prompt, load_prompt
from app.utils.regen_context import build_regen_prefix

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Allocate lesson minutes across the 5 phases; validates sum == duration.

    The LLM is explicitly instructed to make the 5 values sum to duration, but
    this is unreliable enough to warrant a dedicated outer retry loop.  If the
    sum is wrong, we augment the prompt with the exact mismatch and retry —
    up to llm_max_retries additional attempts — before raising RuntimeError.

    Each outer attempt calls call_with_retry with max_retries=0 so the outer
    loop owns all retry budget for this node.

    chapter_block / grounding_instruction are always empty for this node because
    chapter grounding is not applicable to timing allocation (per S2 design).

    In regeneration mode the _regen_prefix is prepended to the base_prompt so
    the LLM stays consistent with the rest of the plan's pacing.
    """
    duration: int = state["duration"]

    # time_breakdown and standards are the two nodes that never use chapter grounding —
    # timing allocation is independent of textbook content.
    base_prompt = format_prompt(
        load_prompt("time_breakdown"),
        duration=duration,
        activities=json.dumps(state["activities"]),
        chapter_block="",
        grounding_instruction="",
    )

    # Regen prefix is prepended to base_prompt once; the outer retry loop then
    # appends the sum-validation error to the already-prefixed base_prompt.
    regen_prefix = build_regen_prefix(
        state.get("regenerateSection", ""),
        state.get("existingPlan"),
        state.get("userInstruction"),
    )
    if regen_prefix:
        base_prompt = regen_prefix + "\n\n" + base_prompt

    current_prompt = base_prompt
    total = 0

    for attempt in range(_settings.llm_max_retries + 1):
        output: TimeBreakdownOutput = call_with_retry(
            prompt=current_prompt,
            response_schema=TimeBreakdownOutput,
            model=_settings.model_name_light,
            max_retries=0,  # outer loop owns retries for sum validation
        )

        total = (
            output.intro
            + output.instruction
            + output.guidedPractice
            + output.independentPractice
            + output.closure
        )

        if total == duration:
            logger.info("time_breakdown node complete: sum=%d == duration=%d", total, duration)
            return {"timeBreakdown": output.model_dump()}

        logger.warning(
            "time_breakdown sum mismatch attempt %d/%d: got %d, expected %d",
            attempt + 1, _settings.llm_max_retries + 1, total, duration,
        )

        if attempt < _settings.llm_max_retries:
            current_prompt = (
                f"{base_prompt}\n\n"
                f"SUM VALIDATION FAILED: Your previous values summed to {total} "
                f"but must equal exactly {duration}. "
                f"Adjust one or more phase values so they sum to {duration} and resubmit."
            )

    raise RuntimeError(
        f"time_breakdown: values summed to {total} instead of {duration} "
        f"after {_settings.llm_max_retries + 1} attempts"
    )
