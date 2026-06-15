"""Tests for post-IA validators."""

from pipeline.validators import (
    boost_agent_from_text,
    extract_emails_from_text,
    extract_firma_autorizada_name,
    extract_phones_from_text,
    validate_extraction,
)

ALFA_SAMPLE = """
Seguros de Vida Alfa S.A.
NIT 860.503.617-2
Servicio al cliente
servicioalcliente@segurosalfa.com.co
Teléfono (60-1) 7 43 53 33 Ext 14451
Andrés Fernando Barón Tautiva
Firma Autorizada
"""


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


def test_extract_emails_from_text_prefers_sac_email():
    emails = extract_emails_from_text(ALFA_SAMPLE)

    assert "servicioalcliente@segurosalfa.com.co" in emails


def test_extract_phones_from_text_bogota_landline():
    phones = extract_phones_from_text(ALFA_SAMPLE)

    assert any(phone.startswith("+571") for phone in phones)


def test_extract_firma_autorizada_person_name():
    name = extract_firma_autorizada_name(ALFA_SAMPLE)

    assert name == "Andrés Fernando Barón Tautiva"


def test_boost_agent_from_text_alfa_like_document():
    boosted = boost_agent_from_text({}, ALFA_SAMPLE)
    agent = boosted.get("agent")
    contacts = boosted.get("insurerContacts")

    assert isinstance(agent, dict)
    assert agent.get("email") == "servicioalcliente@segurosalfa.com.co"
    assert agent.get("phone", "").startswith("+571")
    assert "ext 14451" in agent.get("phone", "")
    assert agent.get("name") == "Andrés Fernando Barón Tautiva"
    assert isinstance(contacts, dict)
    assert contacts.get("email") == "servicioalcliente@segurosalfa.com.co"
