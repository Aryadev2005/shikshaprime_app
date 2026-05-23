import json
from typing import Optional


def build_chapter_block(chapter_ctx: Optional[dict]) -> tuple[str, str]:
    """Return (chapter_block, grounding_instruction) for prompt placeholder filling.

    Mode A: chapter_ctx is None → both strings are empty so prompts work unchanged.
    Mode B: chapter_ctx holds ChapterContext data → structured text block + a
    grounding rule that instructs the LLM to stay within chapter content only.

    Centralised here so the identical logic is not copy-pasted into every node.
    """
    if not chapter_ctx:
        return "", ""

    chapter_block = (
        "CHAPTER CONTEXT (from textbook):\n"
        f"Concepts: {json.dumps(chapter_ctx.get('concepts', []))}\n"
        f"Definitions: {json.dumps(chapter_ctx.get('definitions', []))}\n"
        f"Examples: {json.dumps(chapter_ctx.get('examples', []))}\n"
        f"Exercises: {json.dumps(chapter_ctx.get('exercises', []))}\n"
        f"Subtopics: {json.dumps(chapter_ctx.get('subtopics', []))}"
    )
    grounding_instruction = (
        "GROUNDING RULE: Use ONLY content from the CHAPTER CONTEXT above. "
        "Do NOT invent examples or facts not present in the chapter."
    )
    return chapter_block, grounding_instruction
