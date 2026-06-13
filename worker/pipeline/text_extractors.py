"""Text extraction backends: OpenDataLoader, pymupdf, pdfplumber, MarkItDown, Surya stub."""

from __future__ import annotations

import io
import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from pipeline.odl_extract import OdlElement, extract_with_opendataloader, is_opendataloader_available

logger = logging.getLogger(__name__)

ExtractBackend = Literal["odl", "pymupdf", "pdfplumber", "markitdown", "pypdf", "surya"]


@dataclass(frozen=True, slots=True)
class PdfExtractResult:
    text: str
    backend: ExtractBackend
    elements: tuple[OdlElement, ...] = ()


def _extract_with_pymupdf(pdf_bytes: bytes) -> str:
    import fitz  # pymupdf

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: list[str] = []
    for page in doc:
        pages.append(page.get_text("text"))
    doc.close()
    return "\n".join(pages).strip()


def _extract_with_pdfplumber(pdf_bytes: bytes) -> str:
    import pdfplumber

    pages: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text)
    return "\n".join(pages).strip()


def _extract_with_pypdf(pdf_bytes: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            pages.append(text)
    return "\n".join(pages).strip()


def extract_pdf_full(pdf_bytes: bytes) -> PdfExtractResult:
    """Primary PDF extraction — ODL when available, else pymupdf → pdfplumber → pypdf."""
    if is_opendataloader_available():
        try:
            odl = extract_with_opendataloader(pdf_bytes)
            if odl.text.strip():
                return PdfExtractResult(text=odl.text, backend="odl", elements=odl.elements)
        except Exception as exc:
            logger.warning("OpenDataLoader failed, falling back to pymupdf: %s", exc)

    for backend, fn in (
        ("pymupdf", _extract_with_pymupdf),
        ("pdfplumber", _extract_with_pdfplumber),
        ("pypdf", _extract_with_pypdf),
    ):
        try:
            text = fn(pdf_bytes)
            if text.strip():
                return PdfExtractResult(text=text, backend=backend)  # type: ignore[arg-type]
        except ImportError:
            logger.debug("%s not installed", backend)
        except Exception as exc:
            logger.warning("%s extraction failed: %s", backend, exc)

    return PdfExtractResult(text="", backend="pypdf")


def extract_pdf_text(pdf_bytes: bytes) -> tuple[str, ExtractBackend]:
    """Backward-compatible PDF text extraction."""
    result = extract_pdf_full(pdf_bytes)
    return result.text, result.backend


def run_surya_ocr(pdf_bytes: bytes) -> tuple[str, ExtractBackend]:
    """Surya OCR fallback — stub with clear log; uses pymupdf/pdfplumber for dev."""
    logger.warning(
        "Surya OCR is not configured in this environment — "
        "using pymupdf/pdfplumber fallback for scanned/complex PDFs"
    )
    result = extract_pdf_full(pdf_bytes)
    backend: ExtractBackend = "surya" if result.backend == "odl" else result.backend
    return result.text, backend


def extract_non_pdf_text(file_bytes: bytes, mime_type: str) -> tuple[str, ExtractBackend]:
    """MarkItDown for office/image formats; pypdf for mislabeled PDFs."""
    if mime_type == "application/pdf":
        result = extract_pdf_full(file_bytes)
        return result.text, result.backend

    try:
        from markitdown import MarkItDown

        with tempfile.NamedTemporaryFile(suffix=_suffix_for_mime(mime_type)) as tmp:
            tmp.write(file_bytes)
            tmp.flush()
            result = MarkItDown().convert(tmp.name)
            text = (result.text_content or "").strip()
            if text:
                return text, "markitdown"
    except ImportError:
        logger.warning("markitdown not installed — non-PDF extraction limited")
    except Exception as exc:
        logger.warning("MarkItDown failed: %s", exc)

    return "", "markitdown"


def _suffix_for_mime(mime_type: str) -> str:
    mapping = {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "image/png": ".png",
        "image/jpeg": ".jpg",
    }
    return mapping.get(mime_type, ".bin")
