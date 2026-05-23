import logging

from app.config import get_settings
from app.llm.retry import call_with_retry
from app.schemas.sections import ChapterContext
from app.utils.prompt_loader import format_prompt, load_prompt

logger = logging.getLogger(__name__)
_settings = get_settings()


def extract_chapter_from_text(
    text: str,
    grade: str,
    subject: str,
    topic: str,
    board: str,
) -> dict:
    """Extract structured ChapterContext from raw chapter text (boss's Mode B).

    This is the text-based counterpart to the chapter_extraction node, which
    handles PDF files via Gemini Files API.  Here the Node.js backend has already
    extracted the PDF text and sends it as the chapterPdfText string in
    POST /generate.  This function calls Gemini with the raw text to produce the
    same ChapterContext schema used by all 9 generation nodes.

    The result is stored in state["chapterContext"] before the pipeline starts,
    so all 9 nodes receive chapter grounding via build_chapter_block() exactly
    as they do in Mode B PDF.

    Args:
        text:    The raw chapter text extracted by the Node.js backend.
        grade:   Grade level (e.g. "7").
        subject: Subject name (e.g. "Science").
        topic:   Lesson topic (e.g. "Photosynthesis").
        board:   Curriculum board (e.g. "CBSE").

    Returns:
        ChapterContext as a plain dict (model_dump()) ready to be stored in state.

    Raises:
        RuntimeError: if Gemini fails to return valid ChapterContext after retries.
        ValueError:   if GEMINI_API_KEY is not set.
    """
    prompt = format_prompt(
        load_prompt("chapter_extraction_text"),
        grade=grade,
        subject=subject,
        topic=topic,
        board=board,
        chapter_text=text,
    )

    output: ChapterContext = call_with_retry(
        prompt=prompt,
        response_schema=ChapterContext,
        model=_settings.model_name_heavy,
    )

    logger.info(
        "text chapter extraction complete: %d concepts, %d exercises extracted",
        len(output.concepts),
        len(output.exercises),
    )
    return output.model_dump()
