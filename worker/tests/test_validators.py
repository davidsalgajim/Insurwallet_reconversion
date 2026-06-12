"""Tests for post-IA validators."""

from pipeline.validators import validate_extraction


def test_validate_extraction_high_confidence_for_well_formed_fields():
    result = validate_extraction(
        {
            "insurerName": "Bancolombia Seguros",
            "policyNumber": "POL-12345678",
            "holderName": "Juan Pérez",
            "premium": 1_200_000,
            "currency": "COP",
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
        }
    )

    assert result.confidence["insurerName"] == "high"
    assert result.confidence["policyNumber"] == "high"
    assert result.confidence["holderName"] == "high"
    assert result.confidence["premium"] == "high"
    assert result.confidence["currency"] == "high"
    assert result.confidence["startDate"] == "high"
    assert result.confidence["endDate"] == "high"


def test_validate_extraction_flags_invalid_policy_number():
    result = validate_extraction({"policyNumber": "??"})

    assert result.confidence["policyNumber"] == "low"


def test_validate_extraction_flags_end_before_start():
    result = validate_extraction(
        {
            "startDate": "2025-12-31",
            "endDate": "2025-01-01",
        }
    )

    assert result.confidence["startDate"] == "low"
    assert result.confidence["endDate"] == "low"


def test_validate_extraction_premium_out_of_range_is_low():
    result = validate_extraction({"premium": 999_999_999_999})

    assert result.confidence["premium"] == "low"
