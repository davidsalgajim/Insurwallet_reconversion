"""Quality gate — port of DocumentProcessingService.swift ~363 heuristics."""

from __future__ import annotations

import re

MIN_WORD_COUNT = 100

POLICY_KEYWORDS: tuple[str, ...] = (
    "póliza",
    "poliza",
    "policy",
    "seguro",
    "insurance",
    "aseguradora",
    "insurer",
    "prima",
    "premium",
    "vigencia",
    "coverage",
    "cobertura",
    "tomador",
    "holder",
    "beneficiario",
    "beneficiary",
    "deducible",
    "deductible",
    "clausulado",
    "certificado",
    "certificate",
    "endorsement",
    "endoso",
    "suma asegurada",
    "insured",
    "asegurado",
)


def word_count(text: str) -> int:
    if not text.strip():
        return 0
    return len(re.findall(r"\S+", text))


def has_policy_keywords(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in POLICY_KEYWORDS)


def needs_quality_escalation(text: str) -> bool:
    """True when text is too short or lacks insurance vocabulary → escalate to Surya."""
    return word_count(text) < MIN_WORD_COUNT or not has_policy_keywords(text)
