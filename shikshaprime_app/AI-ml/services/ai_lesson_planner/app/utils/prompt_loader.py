import re
from functools import lru_cache
from pathlib import Path
from typing import Any

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
_ALLOWED_NAME_RE = re.compile(r"^[a-zA-Z0-9_-]+$")


@lru_cache(maxsize=None)
def load_prompt(name: str) -> str:
    """Load a prompt template by filename stem (without .txt).

    Cached after first load so the file is only read once per process.
    Raises FileNotFoundError loudly if the prompt file is missing —
    a missing prompt is always a programmer error, never a runtime condition.

    Only alphanumeric characters, hyphens, and underscores allowed in name
    to prevent path traversal.
    """
    if not _ALLOWED_NAME_RE.match(name):
        raise ValueError(
            f"Invalid prompt name: '{name}'. "
            f"Only alphanumeric characters, hyphens, and underscores are allowed."
        )
    path = _PROMPTS_DIR / f"{name}.txt"
    if not path.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {path}. "
            f"Expected a file at app/prompts/{name}.txt"
        )
    return path.read_text(encoding="utf-8")


def format_prompt(template: str, **kwargs: Any) -> str:
    """Format a prompt template with user-supplied values safely.

    Escapes { and } in every value before calling str.format() so that
    user input containing literal braces (e.g. JSON, math expressions,
    injection attempts like "{ignore_all}") cannot cause KeyError or
    trigger unintended format-string substitutions.
    """
    safe_kwargs = {
        key: str(val).replace("{", "{{").replace("}", "}}") if isinstance(val, str) else val
        for key, val in kwargs.items()
    }
    return template.format(**safe_kwargs)
