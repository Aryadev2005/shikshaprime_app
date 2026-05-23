import json
from typing import Optional

from app.utils.prompt_loader import load_prompt


def build_regen_prefix(
    section_name: str,
    existing_plan: Optional[dict],
    user_instruction: Optional[str] = None,
) -> str:
    """Return the regeneration prefix to prepend to a node's base prompt.

    Uses str.replace() — not format_prompt() — because existing_plan is JSON
    that contains literal { } characters.  format_prompt() would escape those
    to {{ }} which looks corrupt in the LLM prompt.  section_name is validated
    upstream against an allow-list so no injection risk from that path.

    user_instruction is the teacher's free-text note ("make it more activity-based",
    "use MCQ questions", etc.).  When provided, it is injected as a clearly labelled
    block so the LLM treats it as the highest-priority constraint.  When absent the
    block is omitted entirely — no empty heading is shown to the LLM.

    Returns empty string when existing_plan is None (normal generation mode).
    Nodes check the return value with `if regen_prefix:` before prepending.
    """
    if not existing_plan:
        return ""

    if user_instruction and user_instruction.strip():
        instruction_block = (
            "TEACHER'S SPECIFIC REQUEST (highest priority — follow this above all else):\n"
            f"{user_instruction.strip()}\n\n"
        )
    else:
        instruction_block = ""

    template = load_prompt("_regen_prefix")
    return (
        template
        .replace("{section_name}", section_name)
        .replace("{existingPlan}", json.dumps(existing_plan, indent=2))
        .replace("{user_instruction_block}", instruction_block)
    )
