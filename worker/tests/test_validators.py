"""Tests for post-IA validators."""

from pipeline.validators import (
    boost_agent_from_text,
    extract_emails_from_text,
    extract_firma_autorizada_name,
    extract_insurer_contacts_from_text,
    extract_phones_from_text,
    extract_regional_assistance_contacts,
    phone_collides_with_policy_number,
    sanitize_structured_extraction_arrays,
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

EVOUCHER_SAMPLE = """
Tu Assist Card
N° ASSIST CARD
570 17148300 0L01 LA111 / 1
Whatsapp de asistencia
+54 9 11 27039665
Llámanos a nuestras centrales
América Latina
+54 (11) 5555-1500
Norteamérica
+1 800-874-2223
Asia
+82 (2) 2023-5858
Europa
+34 (91) 788-3333
"""

AUTO_TWO_PHONES_SAMPLE = """
Seguros del Estado
Póliza No. AUTO-2024-55667788
Asesor comercial: Laura Gómez
Celular: 300 555 1234
Servicio al cliente
Línea nacional: 01 8000 123 456
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


def test_validate_extraction_policy_number_stays_validated_field():
    """Regression: policy_number must not be shadowed by collision-check string."""
    result = validate_extraction(
        {
            "policyNumber": "570 17148300 0L01 LA111 / 1",
            "agent": {"phone": "+541155551500"},
        }
    )

    policy_field = result.fields["policyNumber"]
    assert hasattr(policy_field, "confidence")
    assert result.confidence["policyNumber"] in {"high", "medium", "low"}


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
    assert agent.get("name") == "Servicio Al Cliente"
    assert isinstance(contacts, list)
    assert contacts[0].get("email") == "servicioalcliente@segurosalfa.com.co"


def test_sanitize_structured_extraction_arrays_strips_sentinels():
    sanitized = sanitize_structured_extraction_arrays(
        {
            "beneficiaryEntries": [
                {"name": "Carlos", "pct": 100},
                {"name": "none", "pct": "none"},
            ],
            "coverageEntries": [
                {"name": "RC", "amount": -1},
                {"name": "Hospitalización", "amount": 1_000_000},
            ],
            "benefitEntries": [
                {"name": "Grúa", "contactInfo": "none", "quantity": "3"},
            ],
        }
    )

    assert sanitized["beneficiaryEntries"] == [{"name": "Carlos", "pct": 100}]
    assert sanitized["coverageEntries"] == [
        {"name": "Hospitalización", "amount": 1_000_000}
    ]
    assert sanitized["benefitEntries"] == [
        {"name": "Grúa", "quantity": "3"},
    ]


def test_phone_collides_with_policy_number_evoucher():
    policy = "570 17148300 0L01 LA111 / 1"
    assert phone_collides_with_policy_number("+5717148300", policy)
    assert not phone_collides_with_policy_number("+18008742223", policy)


def test_extract_regional_assistance_contacts_evoucher():
    contacts = extract_regional_assistance_contacts(EVOUCHER_SAMPLE)
    labels = {c["label"] for c in contacts}
    phones = {c["phone"] for c in contacts}

    assert "América Latina" in labels
    assert "Norteamérica" in labels
    assert "Asia" in labels
    assert "Europa" in labels
    assert any(p.startswith("+1800") for p in phones)
    assert not any("17148300" in p for p in phones)


def test_boost_agent_from_text_evoucher_rejects_policy_number_phone():
    boosted = boost_agent_from_text(
        {
            "policyNumber": "570 17148300 0L01 LA111 / 1",
            "agent": {
                "name": "Servicio al cliente",
                "phone": "+5717148300",
                "email": "agente@aseguradora.com",
            },
        },
        EVOUCHER_SAMPLE,
    )
    agent = boosted.get("agent")
    assert isinstance(agent, dict)
    assert agent.get("phone") != "+5717148300"
    assert agent.get("phone", "").startswith("+54") or agent.get("phone", "").startswith(
        "+1"
    )

    benefits = boosted.get("benefitEntries")
    assert isinstance(benefits, list)
    assert len(benefits) >= 4


def test_validate_extraction_clears_agent_phone_matching_policy_number():
    result = validate_extraction(
        {
            "policyNumber": "570 17148300 0L01 LA111 / 1",
            "agent": {
                "name": "Servicio al cliente",
                "phone": "+5717148300",
            },
        }
    )

    assert result.fields["agent.phone"].value is None
    assert result.confidence["agent.phone"] == "low"


def test_extract_multiple_phones_auto_policy():
    contacts = extract_insurer_contacts_from_text(AUTO_TWO_PHONES_SAMPLE)
    phones = [row.get("phone") for row in contacts if row.get("phone")]

    assert len(phones) >= 2

    boosted = boost_agent_from_text(
        {"policyNumber": "AUTO-2024-55667788"},
        AUTO_TWO_PHONES_SAMPLE,
    )
    agent = boosted.get("agent", {})
    assert not phone_collides_with_policy_number(
        agent.get("phone"),
        "AUTO-2024-55667788",
    )
    insurer_contacts = boosted.get("insurerContacts")
    assert isinstance(insurer_contacts, list)
    assert len(insurer_contacts) >= 2
