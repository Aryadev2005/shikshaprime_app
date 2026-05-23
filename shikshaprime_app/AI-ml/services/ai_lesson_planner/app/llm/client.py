import logging
import time
from typing import Optional

from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
from pydantic import BaseModel

from app.config import get_settings

_settings = get_settings()
logger = logging.getLogger(__name__)

_client: Optional[genai.Client] = None


def get_gemini_client() -> genai.Client:
    global _client
    if _client is None:
        if not _settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=_settings.gemini_api_key)
    return _client


def generate_structured(
    prompt: str,
    response_schema: type[BaseModel],
    model: str,
) -> BaseModel:
    """Call Gemini with structured JSON output.

    Handles 429 rate-limit errors by waiting RATE_LIMIT_RETRY_DELAY_SECONDS
    (default 65s) and retrying once. The free tier allows only 5 RPM; a
    9-node pipeline exceeds this after ~5 calls, making one pause necessary.
    """
    client = get_gemini_client()

    for attempt in range(2):  # one retry on 429
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                },
            )
            if response.parsed is None:
                raise ValueError(
                    f"Gemini returned None for parsed output. "
                    f"Finish reason: {response.candidates[0].finish_reason if response.candidates else 'unknown'}. "
                    f"Text: {response.text}"
                )
            return response.parsed

        except genai_errors.ClientError as e:
            # 429 = free-tier rate limit exceeded; wait and retry once
            if "429" in str(e) and attempt == 0:
                delay = _settings.rate_limit_retry_delay_seconds
                logger.warning(
                    "Rate limit (429) hit for %s — waiting %ds before retry",
                    response_schema.__name__, delay,
                )
                time.sleep(delay)
                continue
            raise  # non-429 ClientError or second attempt — propagate up

        except genai_errors.ServerError as e:
            # 503 = model temporarily overloaded (high demand on free tier).
            # Wait and retry once — usually resolves within a minute.
            if "503" in str(e) and attempt == 0:
                delay = _settings.rate_limit_retry_delay_seconds
                logger.warning(
                    "Model unavailable (503) for %s — waiting %ds before retry. "
                    "This is a temporary Gemini server issue, not a code bug.",
                    response_schema.__name__, delay,
                )
                time.sleep(delay)
                continue
            # Second attempt also failed — raise as RuntimeError so retry.py
            # and main.py can catch it cleanly
            raise RuntimeError(
                f"Gemini model unavailable (503) after retry: {e}"
            ) from e


def generate_structured_with_file(
    prompt: str,
    file_uri: str,
    response_schema: type[BaseModel],
    model: str,
) -> BaseModel:
    """Call Gemini with a PDF file + text prompt for structured JSON output.

    Separate from generate_structured() because multimodal calls require a list
    of content Parts (file + text) whereas text-only calls take a plain string.
    Keeping them separate avoids a confusing optional parameter and makes both
    functions independently testable.

    Mirrors the 429 retry behaviour of generate_structured().
    """
    client = get_gemini_client()

    for attempt in range(2):  # one retry on 429
        try:
            response = client.models.generate_content(
                model=model,
                contents=[
                    genai_types.Part(
                        file_data=genai_types.FileData(
                            file_uri=file_uri,
                            mime_type="application/pdf",
                        )
                    ),
                    genai_types.Part(text=prompt),
                ],
                config={
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                },
            )
            if response.parsed is None:
                raise ValueError(
                    f"Gemini returned None for parsed output. "
                    f"Finish reason: {response.candidates[0].finish_reason if response.candidates else 'unknown'}. "
                    f"Text: {response.text}"
                )
            return response.parsed

        except genai_errors.ClientError as e:
            if "429" in str(e) and attempt == 0:
                delay = _settings.rate_limit_retry_delay_seconds
                logger.warning(
                    "Rate limit (429) hit for file-grounded %s — waiting %ds before retry",
                    response_schema.__name__, delay,
                )
                time.sleep(delay)
                continue
            raise

        except genai_errors.ServerError as e:
            if "503" in str(e) and attempt == 0:
                delay = _settings.rate_limit_retry_delay_seconds
                logger.warning(
                    "Model unavailable (503) for file-grounded %s — waiting %ds before retry.",
                    response_schema.__name__, delay,
                )
                time.sleep(delay)
                continue
            raise RuntimeError(
                f"Gemini model unavailable (503) after retry: {e}"
            ) from e
