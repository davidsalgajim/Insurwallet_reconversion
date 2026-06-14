"""Tests for multilingual policy field lexicon."""

from pipeline.policy_lexicon import (
    FIELD_LABEL_SYNONYMS,
    POLICY_DOCUMENT_KEYWORDS,
    format_field_label_hints,
    format_regional_extraction_rules,
    format_text_extraction_preamble,
    format_vision_user_preamble,
)
from pipeline.claude_extractor import SYSTEM_PROMPT, _build_user_message, _build_vision_user_message


def test_field_label_synonyms_cover_three_locales() -> None:
    assert "aseguradora" in FIELD_LABEL_SYNONYMS["insurerName"]
    assert "insurance company" in FIELD_LABEL_SYNONYMS["insurerName"]
    assert "seguradora" in FIELD_LABEL_SYNONYMS["insurerName"]
    assert "tomador" in FIELD_LABEL_SYNONYMS["holderName"]
    assert "policyholder" in FIELD_LABEL_SYNONYMS["holderName"]
    assert "apólice" in FIELD_LABEL_SYNONYMS["policyNumber"]


def test_policy_document_keywords_are_lowercase() -> None:
    assert all(term == term.lower() for term in POLICY_DOCUMENT_KEYWORDS)
    assert "póliza" in POLICY_DOCUMENT_KEYWORDS or "poliza" in POLICY_DOCUMENT_KEYWORDS
    assert "beneficiario" in POLICY_DOCUMENT_KEYWORDS
    assert "apolice" in POLICY_DOCUMENT_KEYWORDS


def test_format_field_label_hints_lists_schema_fields() -> None:
    hints = format_field_label_hints()
    for field in ("insurerName", "policyNumber", "holderName", "premium"):
        assert f"- {field}:" in hints


def test_regional_rules_mention_latam_languages() -> None:
    rules = format_regional_extraction_rules()
    assert "Spanish" in rules
    assert "Portuguese" in rules
    assert "deudor" in rules
    assert "hasNoExpiration" in rules
    assert "NEVER copy startDate" in rules


def test_vision_preamble_includes_page_count_and_synonyms() -> None:
    preamble = format_vision_user_preamble(3)
    assert "3 page(s)" in preamble
    assert "insurerName" in preamble
    assert "Colombia" in preamble


def test_text_preamble_includes_regional_rules() -> None:
    preamble = format_text_extraction_preamble()
    assert "Spanish" in preamble
    assert "deudor" in preamble


def test_claude_system_prompt_embeds_lexicon() -> None:
    assert "insurerName" in SYSTEM_PROMPT
    assert "Regional extraction rules" in SYSTEM_PROMPT
    assert "Portuguese" in SYSTEM_PROMPT


def test_build_user_message_includes_multilingual_preamble() -> None:
    message = _build_user_message("Póliza 123", has_suspicious=False)
    assert "<document_data>" in message
    assert "Portuguese" in message


def test_build_vision_user_message_includes_synonyms() -> None:
    message = _build_vision_user_message(2, has_suspicious=False)
    assert "2 page(s)" in message
    assert "holderName" in message
