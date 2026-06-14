"""Tests for open-ended policy expiration normalization."""

from __future__ import annotations

from pipeline.claude_extractor import _apply_expiration_heuristics, _normalize_fields
from pipeline.validators import validate_extraction


def test_apply_expiration_heuristics_clears_duplicate_end_date() -> None:
    result = _apply_expiration_heuristics(
        {
            "startDate": "2025-03-28",
            "endDate": "2025-03-28",
        }
    )

    assert result["startDate"] == "2025-03-28"
    assert "endDate" not in result
    assert result["hasNoExpiration"] is True


def test_apply_expiration_heuristics_respects_existing_flag() -> None:
    result = _apply_expiration_heuristics(
        {
            "startDate": "2025-03-28",
            "endDate": "2026-03-28",
            "hasNoExpiration": True,
        }
    )

    assert "endDate" not in result
    assert result["hasNoExpiration"] is True


def test_normalize_fields_applies_expiration_heuristics() -> None:
    result = _normalize_fields(
        {
            "startDate": "2025-03-28",
            "endDate": "2025-03-28",
            "insurerName": "Seguros Alfa",
        }
    )

    assert result["hasNoExpiration"] is True
    assert "endDate" not in result


def test_validate_extraction_coerces_duplicate_dates() -> None:
    validation = validate_extraction(
        {
            "insurerName": "Seguros Alfa",
            "policyNumber": "GRD-482",
            "holderName": "David Salgado",
            "startDate": "2025-03-28",
            "endDate": "2025-03-28",
        }
    )

    assert validation.fields["startDate"].value == "2025-03-28"
    assert validation.fields["endDate"].value is None
