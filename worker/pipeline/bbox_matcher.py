"""Match extracted policy fields to OpenDataLoader element bounding boxes."""

from __future__ import annotations

import re
from typing import TypedDict

from pipeline.odl_extract import OdlElement

CRITICAL_FIELD_IDS = (
    "insurerName",
    "policyNumber",
    "holderName",
    "premium",
    "startDate",
    "endDate",
)


class NormalizedBbox(TypedDict):
    page: int
    left: float
    top: float
    width: float
    height: float


def _normalize_bbox(
    element: OdlElement,
    page_height: float = 792.0,
    page_width: float = 612.0,
) -> NormalizedBbox:
    """Convert ODL PDF-point bbox (origin bottom-left) to normalized top-left overlay."""
    left, bottom, right, top = element.bbox
    width_pts = max(right - left, 1.0)
    height_pts = max(top - bottom, 1.0)
    top_from_top = page_height - top

    return {
        "page": element.page,
        "left": max(0.0, min(1.0, left / page_width)),
        "top": max(0.0, min(1.0, top_from_top / page_height)),
        "width": max(0.0, min(1.0, width_pts / page_width)),
        "height": max(0.0, min(1.0, height_pts / page_height)),
    }


def _needle_for_field(field_id: str, value: object) -> str | None:
    if value is None:
        return None
    if field_id == "premium":
        if isinstance(value, (int, float)):
            digits = re.sub(r"\D", "", str(int(value)))
            return digits[-6:] if len(digits) >= 4 else None
        return None
    text = str(value).strip()
    return text if len(text) >= 3 else None


def match_field_bboxes(
    fields: dict[str, object],
    elements: tuple[OdlElement, ...],
) -> dict[str, NormalizedBbox]:
    """Best-effort match of field values to ODL elements by text overlap."""
    if not elements:
        return {}

    matched: dict[str, NormalizedBbox] = {}

    for field_id in CRITICAL_FIELD_IDS:
        needle = _needle_for_field(field_id, fields.get(field_id))
        if not needle:
            continue

        needle_lower = needle.lower()
        best: OdlElement | None = None
        best_score = 0

        for element in elements:
            content_lower = element.content.lower()
            if needle_lower not in content_lower:
                continue
            score = len(needle_lower) / max(len(content_lower), 1)
            if score > best_score:
                best_score = score
                best = element

        if best is not None:
            matched[field_id] = _normalize_bbox(best)

    return matched
