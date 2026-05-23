import logging

from app.config import get_settings
from app.graph.state import LessonPlanState
from app.llm.retry import call_with_retry_file
from app.schemas.sections import ChapterContext
from app.utils.prompt_loader import format_prompt, load_prompt

logger = logging.getLogger(__name__)
_settings = get_settings()


def run(state: LessonPlanState) -> dict:
    """Extract structured chapter content from a Gemini-uploaded PDF.

    Only runs in Mode B (geminiFileUri present). Sends the PDF file reference
    alongside the extraction prompt — Gemini reads diagrams, tables, and
    equations natively. Returns a small chapterContext dict (~2000 chars) that
    all 9 downstream generation nodes use; the full PDF is never sent again.
    """
    file_uri: str = state["geminiFileUri"]  # type: ignore[assignment]

    prompt = format_prompt(
        load_prompt("chapter_extraction"),
        grade=state["grade"],
        subject=state["subject"],
        topic=state["topic"],
        board=state["board"],
    )

    output: ChapterContext = call_with_retry_file(
        prompt=prompt,
        file_uri=file_uri,
        response_schema=ChapterContext,
        model=_settings.model_name_heavy,
    )

    logger.info(
        "chapter_extraction complete: %d concepts, %d exercises extracted",
        len(output.concepts),
        len(output.exercises),
    )
    return {"chapterContext": output.model_dump()}
