import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

VERSION = "0.1.0"


class Settings:
    """All runtime configuration loaded from environment variables.

    GEMINI_API_KEY is read lazily so the service can start (and serve /health)
    even if the key is absent — the health endpoint will report gemini: "degraded"
    and pipeline calls will return 503. All other fields have safe defaults.
    """

    def __init__(self) -> None:
        self.gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
        self.model_name_heavy: str = os.getenv("MODEL_NAME_HEAVY", "gemini-2.5-flash")
        self.model_name_light: str = os.getenv("MODEL_NAME_LIGHT", "gemini-2.5-flash")
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()

        # Validation & safety limits
        self.max_lesson_duration: int = int(os.getenv("MAX_LESSON_DURATION", "240"))
        self.chapter_text_min_length: int = int(os.getenv("CHAPTER_TEXT_MIN_LENGTH", "50"))
        self.chapter_text_max_length: int = int(os.getenv("CHAPTER_TEXT_MAX_LENGTH", "50000"))

        # Retry policy
        self.llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "2"))

        # Seconds to wait after a 429 rate-limit error before retrying the same call.
        # Free tier allows 5 RPM; the API hint says ~59s. 65 gives a small buffer.
        self.rate_limit_retry_delay_seconds: int = int(
            os.getenv("RATE_LIMIT_RETRY_DELAY_SECONDS", "65")
        )

        # Pipeline execution timeout — set high enough to survive one rate-limit pause
        # (free tier: ~5 nodes + 65s wait + 4 nodes ≈ 3 min; 600s gives headroom)
        self.pipeline_timeout_seconds: int = int(os.getenv("PIPELINE_TIMEOUT_SECONDS", "600"))

        # PDF upload limits (Mode B — Approach 3: Gemini native PDF)
        self.max_pdf_size_mb: int = int(os.getenv("MAX_PDF_SIZE_MB", "20"))

        # Regeneration (S3) — max characters the teacher can type in the
        # "what do you want changed?" instruction box.
        self.user_instruction_max_length: int = int(
            os.getenv("USER_INSTRUCTION_MAX_LENGTH", "500")
        )

        # Observability
        self.request_id_length: int = int(os.getenv("REQUEST_ID_LENGTH", "12"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
