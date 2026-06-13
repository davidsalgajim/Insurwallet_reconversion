"""OpenDataLoader PDF extraction — markdown text + element bboxes."""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class OdlElement:
    page: int
    content: str
    bbox: tuple[float, float, float, float]  # left, bottom, right, top (PDF points)


@dataclass(frozen=True, slots=True)
class OdlExtractResult:
    text: str
    elements: tuple[OdlElement, ...]


def is_opendataloader_available() -> bool:
    try:
        import opendataloader_pdf  # noqa: F401

        return True
    except ImportError:
        pass
    return (
        shutil.which("opendataloader-pdf") is not None
        or shutil.which("opendataloader") is not None
        or shutil.which("odl") is not None
    )


def _parse_odl_json(payload: object) -> tuple[str, tuple[OdlElement, ...]]:
    elements: list[OdlElement] = []
    text_parts: list[str] = []

    def walk(node: object) -> None:
        if isinstance(node, list):
            for item in node:
                walk(item)
            return
        if not isinstance(node, dict):
            return

        content = node.get("content")
        if isinstance(content, str) and content.strip():
            text_parts.append(content.strip())

        raw_bbox = node.get("bounding box") or node.get("bounding_box")
        page_raw = node.get("page number") or node.get("page_number") or node.get("page")
        if (
            isinstance(raw_bbox, (list, tuple))
            and len(raw_bbox) == 4
            and isinstance(content, str)
            and content.strip()
        ):
            page = int(page_raw) if page_raw is not None else 1
            bbox = tuple(float(v) for v in raw_bbox)
            elements.append(OdlElement(page=page, content=content.strip(), bbox=bbox))

        for value in node.values():
            if isinstance(value, (dict, list)):
                walk(value)

    walk(payload)
    text = "\n".join(text_parts).strip()
    return text, tuple(elements)


def _read_odl_outputs(out_dir: Path) -> OdlExtractResult:
    md_files = sorted(out_dir.glob("**/*.md"))
    json_files = sorted(out_dir.glob("**/*.json"))

    text = ""
    elements: tuple[OdlElement, ...] = ()

    if md_files:
        text = md_files[0].read_text(encoding="utf-8").strip()

    if json_files:
        payload = json.loads(json_files[0].read_text(encoding="utf-8"))
        json_text, elements = _parse_odl_json(payload)
        if not text:
            text = json_text

    if not text and not elements:
        raise RuntimeError("OpenDataLoader produced no markdown or JSON output")

    return OdlExtractResult(text=text, elements=elements)


def _extract_with_python_api(pdf_bytes: bytes) -> OdlExtractResult:
    import opendataloader_pdf

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / "input.pdf"
        out_dir = Path(tmp) / "out"
        out_dir.mkdir()
        pdf_path.write_bytes(pdf_bytes)

        opendataloader_pdf.convert(
            input_path=str(pdf_path),
            output_dir=str(out_dir),
            format="json,markdown",
        )
        return _read_odl_outputs(out_dir)


def _extract_with_cli(pdf_bytes: bytes) -> OdlExtractResult:
    cli = (
        shutil.which("opendataloader-pdf")
        or shutil.which("opendataloader")
        or shutil.which("odl")
    )
    if not cli:
        raise RuntimeError("OpenDataLoader CLI not found")

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / "input.pdf"
        out_dir = Path(tmp) / "out"
        out_dir.mkdir()
        pdf_path.write_bytes(pdf_bytes)

        subprocess.run(
            [cli, str(pdf_path), "-o", str(out_dir), "-f", "json,markdown"],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return _read_odl_outputs(out_dir)


def extract_with_opendataloader(pdf_bytes: bytes) -> OdlExtractResult:
    """Run OpenDataLoader (Python API preferred, CLI fallback). Requires JDK 11+."""
    try:
        return _extract_with_python_api(pdf_bytes)
    except ImportError:
        logger.debug("opendataloader_pdf package not installed — trying CLI")
    except Exception as exc:
        logger.warning("OpenDataLoader Python API failed: %s", exc)

    return _extract_with_cli(pdf_bytes)
