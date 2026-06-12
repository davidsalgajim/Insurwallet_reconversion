"""Document extraction orchestration (OpenDataLoader → quality gate → Surya → MarkItDown → Claude)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from pipeline.claude_extractor import (
    ClaudeExtractionError,
    extract_policy_fields,
    serialize_fields_for_api,
)
from pipeline.insurance_terms import apply_insurance_corrections
from pipeline.quality_gate import needs_quality_escalation, word_count
from pipeline.sanitizer import SanitizeResult, sanitize_document_text
from pipeline.storage_loader import StorageDownloadError, download_document_bytes
from pipeline.text_extractors import (
    extract_non_pdf_text,
    extract_pdf_text,
    run_surya_ocr,
)
from pipeline.validators import validate_extraction

logger = logging.getLogger(__name__)

PipelineMethod = Literal["odl", "surya", "markitdown", "pymupdf", "pdfplumber", "pypdf"]


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


def _extract_raw_text(file_bytes: bytes, mime_type: str) -> tuple[str, str]:
    if mime_type == "application/pdf":
        text, backend = extract_pdf_text(file_bytes)
        if needs_quality_escalation(text):
            logger.info(
                "Quality gate failed (words=%s) — escalating to Surya fallback",
                word_count(text),
            )
            surya_text, surya_backend = run_surya_ocr(file_bytes)
            if word_count(surya_text) >= word_count(text):
                return surya_text, surya_backend
        return text, backend

    text, backend = extract_non_pdf_text(file_bytes, mime_type)
    return text, backend


def extract_document(
    storage_path: str,
    *,
    mime_type: str = "application/pdf",
) -> ExtractResult:
    """Full pipeline: download → extract → sanitize → Claude → validate."""
    file_bytes = download_document_bytes(storage_path)
    raw_text, backend = _extract_raw_text(file_bytes, mime_type)
    corrected = apply_insurance_corrections(raw_text)
    sanitized = sanitize_document_text(corrected)

    pipeline_steps: list[str] = [_map_method_to_api(backend)]

    try:
        claude_result = extract_policy_fields(
            sanitized.text,
            has_suspicious_content=sanitized.has_suspicious_content,
        )
        pipeline_steps.append("claude")
    except ClaudeExtractionError:
        logger.exception("Claude extraction failed")
        raise

    validation = validate_extraction(claude_result.fields)
    api_method = _map_method_to_api(backend)

    extraction_payload: dict[str, object] = {
        "fields": serialize_fields_for_api(
            {
                key: validation.fields[key].value
                for key in validation.fields
                if validation.fields[key].value is not None
            }
        ),
        "confidence": validation.to_confidence_dict(),
        "method": api_method,
        "extractedAt": datetime.now(UTC).isoformat(),
    }

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
    except StorageDownloadError as exc:
        raise RuntimeError(f"Could not download document: {exc}") from exc
