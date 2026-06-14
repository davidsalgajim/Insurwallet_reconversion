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
    + " cobertura clausulado beneficiario deducible certificado prima aseguradora tomador poliza seguro "
    * 15
)


@patch("pipeline.extract.run_surya_ocr")
@patch("pipeline.extract.extract_policy_fields")
@patch("pipeline.extract.download_document_bytes")
@patch("pipeline.extract.extract_pdf_full")
def test_extract_document_runs_sanitize_and_claude(
    mock_pdf_full,
    mock_download,
    mock_claude,
    mock_surya,
):
    from pipeline.text_extractors import PdfExtractResult

    mock_download.return_value = b"%PDF-1.4 fake"
    mock_surya.return_value = ("", "surya")
    mock_pdf_full.return_value = PdfExtractResult(
        text=SAMPLE_POLICY_TEXT,
        backend="pymupdf",
    )
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


@patch("pipeline.extract.run_surya_ocr")
@patch("pipeline.extract.extract_policy_fields")
@patch("pipeline.extract.download_document_bytes")
@patch("pipeline.extract.extract_pdf_full")
def test_extract_document_merges_non_validated_fields(
    mock_pdf_full,
    mock_download,
    mock_claude,
    mock_surya,
):
    from pipeline.text_extractors import PdfExtractResult

    mock_download.return_value = b"%PDF-1.4 fake"
    mock_surya.return_value = ("", "surya")
    mock_pdf_full.return_value = PdfExtractResult(
        text=SAMPLE_POLICY_TEXT,
        backend="pymupdf",
    )
    mock_claude.return_value = SimpleNamespace(
        fields={
            "insurerName": "Bancolombia Seguros",
            "policyNumber": "POL-12345678",
            "holderName": "Juan Pérez",
            "startDate": "2025-03-28",
            "endDate": "2025-03-28",
            "hasNoExpiration": True,
            "policyType": "life",
            "beneficiaryEntries": [{"name": "Banco", "pct": 100}],
        }
    )

    result = extract_document("users/u/policies/p/docs/d/policy.pdf")

    fields = result.extraction["fields"]
    assert fields.get("hasNoExpiration") is True
    assert "endDate" not in fields
    assert fields.get("policyType") == "life"
    assert fields.get("beneficiaryEntries")


@patch("pipeline.extract.download_document_bytes")
def test_extract_document_propagates_download_errors(mock_download):
    from pipeline.storage_loader import StorageDownloadError

    mock_download.side_effect = StorageDownloadError("missing file")

    with pytest.raises(StorageDownloadError):
        extract_document("users/u/policies/p/docs/d/missing.pdf")


@patch("pipeline.extract.transcribe_document_from_images")
@patch("pipeline.extract.extract_policy_fields_from_images")
@patch("pipeline.extract.render_pdf_page_images")
@patch("pipeline.extract.run_surya_ocr")
@patch("pipeline.extract.download_document_bytes")
@patch("pipeline.extract.extract_pdf_full")
def test_extract_document_uses_vision_transcription_for_rag(
    mock_pdf_full,
    mock_download,
    mock_surya,
    mock_render,
    mock_claude_vision,
    mock_transcribe,
):
    from pipeline.text_extractors import PdfExtractResult

    mock_download.return_value = b"%PDF-1.4 fake"
    mock_surya.return_value = ("", "surya")
    mock_pdf_full.return_value = PdfExtractResult(text="x", backend="pymupdf")
    mock_render.return_value = [b"page-1"]
    mock_claude_vision.return_value = SimpleNamespace(
        fields={
            "insurerName": "Seguros Alfa",
            "policyNumber": "GRD-482",
            "holderName": "Banco",
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
        }
    )
    mock_transcribe.return_value = (
        "--- Page 1 ---\nExclusión por deportes extremos y guerra."
    )

    result = extract_document("users/u/policies/p/docs/d/policy.pdf")

    assert result.rag_text.startswith("--- Page 1 ---")
    assert "Exclusión por deportes" in result.rag_text
    assert result.rag_word_count > 0
    assert "transcribe" in result.pipeline_steps
    mock_transcribe.assert_called_once()
