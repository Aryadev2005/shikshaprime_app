"""Smoke tests verifying the scaffold is correctly wired up."""
from app.utils.prompt_loader import load_prompt


def test_app_imports() -> None:
    import app  # noqa: F401
    import app.config  # noqa: F401
    import app.main  # noqa: F401
    import app.observability.logging  # noqa: F401
    import app.utils.prompt_loader  # noqa: F401


def test_prompt_loader_raises_on_missing_file() -> None:
    try:
        load_prompt("__nonexistent_prompt__")
        raise AssertionError("Should have raised FileNotFoundError")
    except FileNotFoundError as e:
        assert "__nonexistent_prompt__" in str(e)
