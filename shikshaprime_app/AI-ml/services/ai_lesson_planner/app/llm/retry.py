import logging
from typing import Optional

from pydantic import BaseModel, ValidationError

from app.config import get_settings
from app.llm.client import generate_structured, generate_structured_with_file

logger = logging.getLogger(__name__)

_settings = get_settings()


def call_with_retry(
    prompt: str,
    response_schema: type[BaseModel],
    model: str,
    max_retries: Optional[int] = None,
) -> BaseModel:
    max_retries = max_retries if max_retries is not None else _settings.llm_max_retries
    last_error: Optional[str] = None
    current_prompt = prompt

    for attempt in range(max_retries + 1):
        try:
            result = generate_structured(
                prompt=current_prompt,
                response_schema=response_schema,
                model=model,
            )
            return result

        except (ValidationError, ValueError) as e:
            last_error = str(e)
            safe_error = last_error[:300]
            logger.warning(
                "Generation failed on attempt %d/%d for %s: %s",
                attempt + 1, max_retries + 1,
                response_schema.__name__,
                safe_error,
            )
            if attempt < max_retries:
                current_prompt = (
                    f"{prompt}\n\n"
                    f"Your previous response failed:\n{safe_error}\n"
                    f"Return only valid JSON matching the required schema."
                )

    raise RuntimeError(
        f"Failed to generate valid {response_schema.__name__} "
        f"after {max_retries + 1} attempts. Last error: {last_error}"
    )


def call_with_retry_file(
    prompt: str,
    file_uri: str,
    response_schema: type[BaseModel],
    model: str,
    max_retries: Optional[int] = None,
) -> BaseModel:
    """Retry wrapper for generate_structured_with_file (multimodal PDF calls).

    Mirrors call_with_retry() exactly but delegates to generate_structured_with_file()
    instead of generate_structured(). On validation failure, the error is appended to
    the text prompt (not the file reference) so the retry carries context without
    re-uploading the PDF.
    """
    max_retries = max_retries if max_retries is not None else _settings.llm_max_retries
    last_error: Optional[str] = None
    current_prompt = prompt

    for attempt in range(max_retries + 1):
        try:
            result = generate_structured_with_file(
                prompt=current_prompt,
                file_uri=file_uri,
                response_schema=response_schema,
                model=model,
            )
            return result

        except (ValidationError, ValueError) as e:
            last_error = str(e)
            safe_error = last_error[:300]
            logger.warning(
                "File-grounded generation failed on attempt %d/%d for %s: %s",
                attempt + 1, max_retries + 1,
                response_schema.__name__,
                safe_error,
            )
            if attempt < max_retries:
                current_prompt = (
                    f"{prompt}\n\n"
                    f"Your previous response failed:\n{safe_error}\n"
                    f"Return only valid JSON matching the required schema."
                )

    raise RuntimeError(
        f"Failed to generate valid {response_schema.__name__} "
        f"after {max_retries + 1} attempts. Last error: {last_error}"
    )
