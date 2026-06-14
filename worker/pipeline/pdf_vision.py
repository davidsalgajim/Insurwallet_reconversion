"""Render PDF pages to images for Claude vision extraction."""

from __future__ import annotations


def render_pdf_page_images(
    pdf_bytes: bytes,
    *,
    max_pages: int = 8,
    dpi: int = 180,
) -> list[bytes]:
    import fitz  # pymupdf

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images: list[bytes] = []

    for page_index in range(min(doc.page_count, max_pages)):
        page = doc.load_page(page_index)
        pixmap = page.get_pixmap(dpi=dpi)
        images.append(pixmap.tobytes("png"))

    doc.close()
    return images
