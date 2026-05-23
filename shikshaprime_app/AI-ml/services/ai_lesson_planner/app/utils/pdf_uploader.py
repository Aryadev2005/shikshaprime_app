import io
import logging

from app.llm.client import get_gemini_client

logger = logging.getLogger(__name__)


def upload_pdf_to_gemini(pdf_bytes: bytes) -> str:
    """Upload raw PDF bytes to Gemini Files API and return the file URI.

    The URI is stored in state and passed to chapter_extraction which sends
    it as a file reference alongside the extraction prompt. Gemini stores
    uploaded files for 48 hours — sufficient for a single pipeline run.

    Returns:
        Full Gemini file URI, e.g.
        "https://generativelanguage.googleapis.com/v1beta/files/abc123"
    """
    client = get_gemini_client()
    file_obj = client.files.upload(
        file=io.BytesIO(pdf_bytes),
        config={"mime_type": "application/pdf", "display_name": "chapter.pdf"},
    )
    logger.info("PDF uploaded to Gemini Files API: name=%s", file_obj.name)
    return file_obj.uri
