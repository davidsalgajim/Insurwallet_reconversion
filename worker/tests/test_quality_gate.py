"""Tests for quality gate heuristics."""

from pipeline.quality_gate import (
    MIN_WORD_COUNT,
    has_policy_keywords,
    needs_quality_escalation,
    word_count,
)


def test_word_count_empty():
    assert word_count("") == 0


def test_has_policy_keywords_detects_spanish_terms():
    assert has_policy_keywords("Certificado de póliza de seguro de vida")


def test_needs_escalation_when_too_few_words():
    short = " ".join(["word"] * (MIN_WORD_COUNT - 1))
    assert needs_quality_escalation(short) is True


def test_needs_escalation_when_missing_keywords():
    long_generic = " ".join(["lorem"] * 150)
    assert needs_quality_escalation(long_generic) is True


def test_passes_quality_gate_with_rich_policy_text():
    text = (
        "Póliza de seguro No. 998877\n"
        "Aseguradora: Mapfre\n"
        "Tomador: Ana García\n"
        "Prima anual: COP 2.500.000\n"
        "Vigencia: 01/01/2025 - 31/12/2025\n"
        + " cobertura deducible beneficiario " * 20
    )
    assert needs_quality_escalation(text) is False
