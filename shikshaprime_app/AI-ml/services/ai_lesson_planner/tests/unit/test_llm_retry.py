"""Tests for the LLM retry helper with mocked Gemini responses."""
from unittest.mock import patch

import pytest
from pydantic import BaseModel, Field, ValidationError

from app.llm.retry import call_with_retry


class _DummyOutput(BaseModel):
    value: str = Field(description="A test value")


def test_success_first_attempt() -> None:
    """Retry succeeds on the very first call."""
    with patch("app.llm.retry.generate_structured") as mock:
        mock.return_value = _DummyOutput(value="hello")
        result = call_with_retry(
            prompt="test",
            response_schema=_DummyOutput,
            model="gemini-2.5-flash",
        )
    assert isinstance(result, _DummyOutput)
    assert result.value == "hello"
    assert mock.call_count == 1


def test_success_on_retry() -> None:
    """First call fails with ValidationError, second succeeds."""
    calls = []

    def _side_effect(prompt, response_schema, model):
        calls.append(prompt)
        if len(calls) == 1:
            raise ValidationError.from_exception_data(
                "_DummyOutput", line_errors=[
                    {"type": "value_error", "loc": ("value",), "msg": "too short", "input": "", "ctx": {"error": "too short"}},
                ],
            )
        return _DummyOutput(value="valid")

    with patch("app.llm.retry.generate_structured") as mock:
        mock.side_effect = _side_effect
        result = call_with_retry(
            prompt="test prompt",
            response_schema=_DummyOutput,
            model="gemini-2.5-flash",
            max_retries=2,
        )
    assert result.value == "valid"


def test_fail_after_max_retries() -> None:
    """All attempts fail with ValidationError; retry raises RuntimeError."""
    with patch("app.llm.retry.generate_structured") as mock:
        mock.side_effect = ValidationError.from_exception_data(
            "_DummyOutput", line_errors=[
                {"type": "value_error", "loc": ("value",), "msg": "bad", "input": "", "ctx": {"error": "bad"}},
            ],
        )
        with pytest.raises(RuntimeError, match="Failed to generate valid _DummyOutput"):
            call_with_retry(
                prompt="test",
                response_schema=_DummyOutput,
                model="gemini-2.5-flash",
                max_retries=2,
            )
    assert mock.call_count == 3


def test_value_error_from_client_is_retried() -> None:
    """ValueError from generate_structured triggers retry."""
    calls = []

    def _side_effect(prompt, response_schema, model):
        calls.append(prompt)
        if len(calls) == 1:
            raise ValueError("Gemini returned None")
        return _DummyOutput(value="recovered")

    with patch("app.llm.retry.generate_structured") as mock:
        mock.side_effect = _side_effect
        result = call_with_retry(
            prompt="test",
            response_schema=_DummyOutput,
            model="gemini-2.5-flash",
            max_retries=1,
        )
    assert result.value == "recovered"
    assert mock.call_count == 2
