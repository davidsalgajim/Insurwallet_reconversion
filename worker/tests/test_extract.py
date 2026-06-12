"""Tests for extract pipeline orchestration."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from pipeline.extract import extract_document


SAMPLE_POLICY_TEXT = (
    "Póliza de seguro de vida No. POL-12345678\n"
    "Aseguradora: Bancolombia Seguros\n"
    "Tomador: Juan Pérez\n"
    "Prima anual: COP $1.200.000\n"
    "Vigencia: 01/01/2025 - 31/12/2025\n"
    + " cobertura clausulado beneficiario deducible certificado " * 8
)


@patch("pipeline.extract.extract_policy_fields")
@patch("pipeline.extract.download_document_bytes")
@patch("pipeline.extract.extract_pdf_text")
def test_extract_document_runs_sanitize_and_claude(
    mock_pdf_text,
    mock_download,
    mock_claude,
):
    mock_download.return_value = b"%PDF-1.4 fake"
    mock_pdf_text.return_value = (SAMPLE_POLICY_TEXT, "pymupdf")
    mock_claude.return_value = SimpleNamespace(
        fields={
            "insurerName": "Bancolombia Seguros",
            "policyNumber": "POL-12345678",
            "holderName": "Juan Pérez",
            "premium": 1_200_000,
            "currency": "COP",
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
        }
    )

    result = extract_document("users/u/policies/p/docs/d/policy.pdf")

    assert result.word_count > 0
    assert "insurerName" in result.extraction["fields"]
    assert result.confidence["insurerName"] in ("high", "medium", "low")
    mock_claude.assert_called_once()
    sanitized_arg = mock_claude.call_args.kwargs.get("sanitized_text") or mock_claude.call_args[0][0]
    assert "Bancolombia" in sanitized_arg


@patch("pipeline.extract.download_document_bytes")
def test_extract_document_propagates_download_errors(mock_download):
    from pipeline.storage_loader import StorageDownloadError

    mock_download.side_effect = StorageDownloadError("missing file")

    with pytest.raises(StorageDownloadError):
        extract_document("users/u/policies/p/docs/d/missing.pdf")
