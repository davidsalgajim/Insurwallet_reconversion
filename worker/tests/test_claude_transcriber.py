"""Tests for vision transcription helper."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

from pipeline.claude_transcriber import transcribe_document_from_images


def test_transcribe_document_from_images_returns_empty_without_pages():
    assert transcribe_document_from_images([]) == ""


def test_transcribe_document_from_images_combines_pages():
    client = MagicMock()
    client.messages.create.return_value = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="Exclusión por deportes extremos.")]
    )

    result = transcribe_document_from_images(
        [b"page-1", b"page-2"],
        client=client,
    )

    assert "--- Page 1 ---" in result
    assert "--- Page 2 ---" in result
    assert "Exclusión por deportes extremos." in result
    assert client.messages.create.call_count == 2
