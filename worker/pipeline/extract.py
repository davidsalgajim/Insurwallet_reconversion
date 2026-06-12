"""Document extraction orchestration (OpenDataLoader → quality gate → Surya → MarkItDown).

Full pipeline integration is deferred to tasks 3.3–3.5; this module defines the
stub contract used by the Cloud Run job endpoint.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pipeline.sanitizer import SanitizeResult, sanitize_document_text

PipelineMethod = Literal["odl", "surya", "markitdown"]


@dataclass(frozen=True, slots=True)
class ExtractResult:
    text: str
    method: PipelineMethod
    word_count: int
    sanitized: SanitizeResult


def extract_document(
    storage_path: str,
    *,
    mime_type: str = "application/pdf",
) -> ExtractResult:
    """Run extraction stub, then sanitize text before downstream LLM steps."""
    del mime_type  # used when ODL / MarkItDown routing is implemented (3.3–3.5)
    del storage_path

    raw_text = ""
    sanitized = sanitize_document_text(raw_text)

    return ExtractResult(
        text=sanitized.text,
        method="odl",
        word_count=len(sanitized.text.split()),
        sanitized=sanitized,
    )
