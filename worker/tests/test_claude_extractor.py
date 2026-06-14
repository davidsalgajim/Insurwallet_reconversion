"""Tests for Claude structured extraction (mocked Anthropic client)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pytest

from pipeline.claude_extractor import (
    ClaudeExtractionError,
    extract_policy_fields,
)


@dataclass
class FakeToolBlock:
    type: str
    name: str
    input: dict[str, object]


@dataclass
class FakeMessageResponse:
    content: list[FakeToolBlock]


class FakeMessages:
    def __init__(self, tool_input: dict[str, object]) -> None:
        self._tool_input = tool_input
        self.last_kwargs: dict[str, Any] | None = None

    def create(self, **kwargs: Any) -> FakeMessageResponse:
        self.last_kwargs = kwargs
        return FakeMessageResponse(
            content=[
                FakeToolBlock(
                    type="tool_use",
                    name="extract_policy_fields",
                    input=self._tool_input,
                )
            ]
        )


class FakeAnthropicClient:
    def __init__(self, tool_input: dict[str, object]) -> None:
        self.messages = FakeMessages(tool_input)


def test_extract_policy_fields_uses_tool_use_and_wraps_document():
    client = FakeAnthropicClient(
        {
            "insurerName": "Sura",
            "policyNumber": "ABC-12345",
            "holderName": "María López",
            "premium": 500_000,
            "currency": "COP",
            "startDate": "2025-03-01",
            "endDate": "2026-03-01",
        }
    )

    result = extract_policy_fields(
        "Póliza No. ABC-12345\nAseguradora: Sura",
        client=client,
    )

    assert result.fields["insurerName"] == "Sura"
    assert result.fields["policyNumber"] == "ABC-12345"
    assert client.messages.last_kwargs is not None
    assert client.messages.last_kwargs["tool_choice"] == {
        "type": "tool",
        "name": "extract_policy_fields",
    }
    user_content = client.messages.last_kwargs["messages"][0]["content"]
    user_text = user_content[0]["text"] if isinstance(user_content, list) else user_content
    assert "<document_data>" in user_text
    assert "Portuguese" in user_text


def test_extract_policy_fields_requires_api_key_without_client(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    with pytest.raises(ClaudeExtractionError, match="ANTHROPIC_API_KEY"):
        extract_policy_fields("some text", api_key="")


def test_extract_policy_fields_rejects_empty_text():
    client = FakeAnthropicClient({})

    with pytest.raises(ClaudeExtractionError, match="empty"):
        extract_policy_fields("   ", client=client)
