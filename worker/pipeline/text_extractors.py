"""Text extraction backends: OpenDataLoader, pymupdf, pdfplumber, MarkItDown, Surya stub."""

from __future__ import annotations

import io
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

ExtractBackend = Literal["odl", "pymupdf", "pdfplumber", "markitdown", "pypdf", "surya"]


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


def is_opendataloader_available() -> bool:
    return shutil.which("opendataloader") is not None or shutil.which("odl") is not None


def _extract_with_opendataloader(pdf_bytes: bytes) -> str:
    """Run OpenDataLoader CLI if installed (JDK required). Returns markdown text."""
    cli = shutil.which("opendataloader") or shutil.which("odl")
    if not cli:
        raise RuntimeError("OpenDataLoader CLI not found")

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / "input.pdf"
        out_dir = Path(tmp) / "out"
        out_dir.mkdir()
        pdf_path.write_bytes(pdf_bytes)

        subprocess.run(
            [cli, str(pdf_path), "-o", str(out_dir)],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )

        md_files = list(out_dir.glob("**/*.md"))
        if not md_files:
            raise RuntimeError("OpenDataLoader produced no markdown output")

        return md_files[0].read_text(encoding="utf-8").strip()


def extract_pdf_text(pdf_bytes: bytes) -> tuple[str, ExtractBackend]:
    """Primary PDF extraction — ODL when available, else pymupdf → pdfplumber → pypdf."""
    if is_opendataloader_available():
        try:
            return _extract_with_opendataloader(pdf_bytes), "odl"
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
                return text, backend  # type: ignore[return-value]
        except ImportError:
            logger.debug("%s not installed", backend)
        except Exception as exc:
            logger.warning("%s extraction failed: %s", backend, exc)

    return "", "pypdf"


def run_surya_ocr(pdf_bytes: bytes) -> tuple[str, ExtractBackend]:
    """Surya OCR fallback — stub with clear log; uses pymupdf/pdfplumber for dev."""
    logger.warning(
        "Surya OCR is not configured in this environment — "
        "using pymupdf/pdfplumber fallback for scanned/complex PDFs"
    )
    text, backend = extract_pdf_text(pdf_bytes)
    return text, "surya" if backend == "odl" else backend


def extract_non_pdf_text(file_bytes: bytes, mime_type: str) -> tuple[str, ExtractBackend]:
    """MarkItDown for office/image formats; pypdf for mislabeled PDFs."""
    if mime_type == "application/pdf":
        return extract_pdf_text(file_bytes)

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
