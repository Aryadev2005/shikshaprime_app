import json
import logging
import time
from contextvars import ContextVar
from typing import Optional

# Per-request correlation ID stored in a contextvar so it's async-safe
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class _JsonFormatter(logging.Formatter):
    """Emit one JSON object per log record to stdout."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S.{ms}Z").format(
                ms=str(int(record.msecs)).zfill(3)
            ),
            "level": record.levelname,
            "message": record.getMessage(),
        }
        rid = request_id_var.get()
        if rid:
            payload["request_id"] = rid
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging(level: str = "INFO") -> None:
    """Set up root logger with JSON output. Call once at app startup."""
    handler = logging.StreamHandler()
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level, logging.INFO))


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
