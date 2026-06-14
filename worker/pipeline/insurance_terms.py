"""Insurance vocabulary for OCR post-correction (ported from iOS insuranceCustomWords)."""

from __future__ import annotations

from pipeline.policy_lexicon import FIELD_LABEL_SYNONYMS, POLICY_DOCUMENT_KEYWORDS

# Carrier and regional names (not in field-label synonyms)
_CARRIER_AND_REGIONAL_WORDS: frozenset[str] = frozenset(
    {
        "bancolombia",
        "suramericana",
        "sura",
        "mapfre",
        "allianz",
        "axa",
        "colpatria",
        "bolívar",
        "bolivar",
        "liberty",
        "equidad",
        "seguros alfa",
        "alfa",
        "occidente",
        "chubb",
        "zurich",
        "hdi",
        "porto seguro",
        "bradesco",
        "itau",
        "metlife",
        "prudential",
        "grupo nacional",
        "gnp",
        "qualitas",
        "inbursa",
        "rsa",
        "sancor",
        "la caja",
        "federación patronal",
        "federacion patronal",
    }
)

INSURANCE_CUSTOM_WORDS: frozenset[str] = frozenset(
    dict.fromkeys(
        [
            *POLICY_DOCUMENT_KEYWORDS,
            *(term.lower() for terms in FIELD_LABEL_SYNONYMS.values() for term in terms),
            *_CARRIER_AND_REGIONAL_WORDS,
        ]
    )
)


def apply_insurance_corrections(text: str) -> str:
    """Lightweight OCR correction for known insurance terms (case-insensitive)."""
    if not text:
        return text

    corrected = text
    replacements = {
        "poliza": "póliza",
        "POLIZA": "PÓLIZA",
        "asegurad0": "asegurado",
        "prim@": "prima",
        "cobertur@": "cobertura",
    }
    for wrong, right in replacements.items():
        corrected = corrected.replace(wrong, right)

    return corrected
