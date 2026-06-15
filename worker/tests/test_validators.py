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


def test_validate_extraction_agent_colombia_phone():
    result = validate_extraction(
        {
            "agent": {
                "name": "Laura Gómez",
                "phone": "300 123 4567",
                "email": "laura@aseguradora.com",
            }
        }
    )

    assert result.confidence["agent.name"] == "high"
    assert result.confidence["agent.phone"] == "high"
    assert result.confidence["agent.email"] == "high"
    assert result.fields["agent.phone"].value == "+573001234567"


def test_validate_extraction_rejects_agent_placeholders():
    result = validate_extraction(
        {
            "agent": {
                "name": "Por definir",
                "phone": "+570000000000",
                "email": "pendiente@example.com",
            }
        }
    )

    assert result.fields["agent.name"].value is None
    assert result.fields["agent.phone"].value is None
    assert result.fields["agent.email"].value is None


def test_validate_extraction_premium_out_of_range_is_low():
    result = validate_extraction({"premium": 999_999_999_999})

    assert result.confidence["premium"] == "low"
