"""Document extraction orchestration (OpenDataLoader → quality gate → Surya → MarkItDown → Claude)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from pipeline.claude_extractor import (
    ClaudeExtractionError,
    _apply_expiration_heuristics,
    extract_policy_fields,
    extract_policy_fields_from_images,
    serialize_fields_for_api,
)
from pipeline.insurance_terms import apply_insurance_corrections
from pipeline.pdf_vision import render_pdf_page_images
from pipeline.quality_gate import is_low_signal_text, needs_quality_escalation, word_count
from pipeline.sanitizer import SanitizeResult, sanitize_document_text
from pipeline.storage_loader import StorageDownloadError, download_document_bytes
from pipeline.bbox_matcher import match_field_bboxes
from pipeline.errors import PdfEncryptedError
from pipeline.text_extractors import (
    PdfExtractResult,
    extract_non_pdf_text,
    extract_pdf_full,
    run_surya_ocr,
)
from pipeline.validators import ValidationResult, validate_extraction

logger = logging.getLogger(__name__)

PipelineMethod = Literal["odl", "surya", "markitdown", "pymupdf", "pdfplumber", "pypdf"]


def _merge_extraction_fields(
    claude_fields: dict[str, object],
    validation: ValidationResult,
) -> dict[str, object]:
    """Prefer validated critical fields; keep full Claude output (policyType, agent, etc.)."""
    merged: dict[str, object] = {
        key: value
        for key, value in claude_fields.items()
        if value is not None and value != "" and value != []
    }
    for key, field in validation.fields.items():
        if field.value is not None:
            merged[key] = field.value
    return merged


@dataclass(frozen=True, slots=True)
class ExtractResult:
    text: str
    method: PipelineMethod
    word_count: int
    sanitized: SanitizeResult
    extraction: dict[str, object]
    confidence: dict[str, str]
    pipeline_steps: tuple[str, ...]


def _map_method_to_api(method: str) -> str:
    if method in ("pymupdf", "pdfplumber", "pypdf"):
        return "odl"
    if method == "surya":
        return "surya"
    if method == "markitdown":
        return "markitdown"
    return method


def _extract_raw_text(
    file_bytes: bytes, mime_type: str
) -> tuple[PdfExtractResult, bool]:
    """Return extracted text and whether ODL quality gate escalated to OCR."""
    if mime_type == "application/pdf":
        result = extract_pdf_full(file_bytes)
        if needs_quality_escalation(result.text):
            logger.info(
                "Quality gate failed (words=%s) — escalating to Surya fallback",
                word_count(result.text),
            )
            surya_text, surya_backend = run_surya_ocr(file_bytes)
            if word_count(surya_text) >= word_count(result.text):
                return (
                    PdfExtractResult(
                        text=surya_text,
                        backend=surya_backend,  # type: ignore[arg-type]
                        elements=result.elements,
                    ),
                    True,
                )
        return result, False

    text, backend = extract_non_pdf_text(file_bytes, mime_type)
    return PdfExtractResult(text=text, backend=backend), False  # type: ignore[arg-type]


def extract_document(
    storage_path: str,
    *,
    mime_type: str = "application/pdf",
) -> ExtractResult:
    """Full pipeline: download → extract → sanitize → Claude → validate."""
    file_bytes = download_document_bytes(storage_path)
    pdf_result, escalated_from_odl = _extract_raw_text(file_bytes, mime_type)
    backend = pdf_result.backend
    corrected = apply_insurance_corrections(pdf_result.text)
    sanitized = sanitize_document_text(corrected)

    use_vision = mime_type == "application/pdf" and (
        is_low_signal_text(sanitized.text) or escalated_from_odl
    )
    pipeline_steps: list[str] = []

    try:
        if use_vision:
            logger.info(
                "Low-signal PDF text (words=%s) — using Claude vision on rendered pages",
                word_count(sanitized.text),
            )
            page_images = render_pdf_page_images(file_bytes)
            pipeline_steps.append("vision")
            claude_result = extract_policy_fields_from_images(
                page_images,
                has_suspicious_content=sanitized.has_suspicious_content,
            )
            backend = "surya"
        else:
            pipeline_steps.append(_map_method_to_api(backend))
            claude_result = extract_policy_fields(
                sanitized.text,
                has_suspicious_content=sanitized.has_suspicious_content,
            )
        pipeline_steps.append("claude")
    except ClaudeExtractionError:
        logger.exception("Claude extraction failed")
        raise

    claude_fields = _apply_expiration_heuristics(dict(claude_result.fields))
    validation = validate_extraction(claude_fields)
    api_method = _map_method_to_api(backend)

    serialized_fields = serialize_fields_for_api(
        _merge_extraction_fields(claude_fields, validation)
    )
    field_bboxes = match_field_bboxes(serialized_fields, pdf_result.elements)

    extraction_payload: dict[str, object] = {
        "fields": serialized_fields,
        "confidence": validation.to_confidence_dict(),
        "method": api_method,
        "extractedAt": datetime.now(UTC).isoformat(),
    }
    if field_bboxes:
        extraction_payload["bboxes"] = field_bboxes

    return ExtractResult(
        text=sanitized.text,
        method=backend if backend in ("odl", "surya", "markitdown") else "odl",  # type: ignore[arg-type]
        word_count=word_count(sanitized.text),
        sanitized=sanitized,
        extraction=extraction_payload,
        confidence=validation.to_confidence_dict(),
        pipeline_steps=tuple(pipeline_steps),
    )


def extract_document_safe(
    storage_path: str,
    *,
    mime_type: str = "application/pdf",
) -> ExtractResult:
    """Wrapper that maps storage errors to a clear runtime error."""
    try:
        return extract_document(storage_path, mime_type=mime_type)
    except PdfEncryptedError:
        raise
    except StorageDownloadError as exc:
        raise RuntimeError(f"Could not download document: {exc}") from exc
