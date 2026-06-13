"""Golden set gate — critical field accuracy >= 95% (task 3.10)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.text_extractors import extract_pdf_text
from pipeline.validators import validate_extraction

GOLDEN_ROOT = Path(__file__).resolve().parent / "golden"
MANIFEST_PATH = GOLDEN_ROOT / "manifest.json"


def _load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _normalize_value(value: object) -> str | float | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        trimmed = value.strip()
        if len(trimmed) == 10 and trimmed[4] == "-" and trimmed[7] == "-":
            try:
                return date.fromisoformat(trimmed).isoformat()
            except ValueError:
                pass
        return trimmed
    return str(value)


def _values_match(expected: object, actual: object) -> bool:
    norm_expected = _normalize_value(expected)
    norm_actual = _normalize_value(actual)
    if norm_expected is None and norm_actual is None:
        return True
    if isinstance(norm_expected, float) and isinstance(norm_actual, float):
        return abs(norm_expected - norm_actual) < 0.01
    return str(norm_expected).lower() == str(norm_actual).lower()


def _make_pdf_bytes(lines: list[str]) -> bytes:
    import fitz

    doc = fitz.open()
    page = doc.new_page()
    y = 72
    for line in lines:
        page.insert_text((72, y), line, fontsize=11)
        y += 16
    payload = doc.tobytes()
    doc.close()
    return payload


@pytest.fixture(scope="module")
def manifest() -> dict:
    return _load_manifest()


def test_golden_manifest_has_twenty_cases(manifest: dict):
    assert len(manifest["cases"]) >= 20


def test_golden_critical_fields_meet_threshold(manifest: dict):
    critical_fields: list[str] = manifest["critical_fields"]
    min_accuracy: float = manifest["min_critical_accuracy"]

    matches = 0
    total = 0
    failures: list[str] = []

    for case in manifest["cases"]:
        result = validate_extraction(case["input"])
        for field_id in critical_fields:
            if field_id not in case["expected"]:
                continue
            total += 1
            actual = result.fields.get(field_id)
            actual_value = actual.value if actual else None
            if _values_match(case["expected"][field_id], actual_value):
                matches += 1
            else:
                failures.append(
                    f"{case['id']}.{field_id}: expected {case['expected'][field_id]!r}, got {actual_value!r}"
                )

    accuracy = matches / total if total else 0.0
    assert accuracy >= min_accuracy, (
        f"Golden critical-field accuracy {accuracy:.1%} < {min_accuracy:.0%}. "
        f"Failures: {failures[:5]}"
    )


def test_golden_pdf_text_extraction_keywords(manifest: dict):
    for pdf_case in manifest.get("pdf_cases", []):
        pdf_bytes = _make_pdf_bytes(pdf_case["lines"])
        text, _backend = extract_pdf_text(pdf_bytes)
        assert text.strip(), f"{pdf_case['id']}: empty extraction"
        for keyword in pdf_case["must_contain"]:
            assert keyword.lower() in text.lower(), (
                f"{pdf_case['id']}: missing keyword {keyword!r} in {text[:200]!r}"
            )
