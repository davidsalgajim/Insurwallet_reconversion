"""Insurance vocabulary for OCR post-correction (ported from iOS insuranceCustomWords)."""

from __future__ import annotations

# Subset of ~200 terms — ES/EN/PT insurance domain vocabulary.
INSURANCE_CUSTOM_WORDS: frozenset[str] = frozenset(
    {
        "póliza",
        "poliza",
        "seguro",
        "aseguradora",
        "asegurado",
        "tomador",
        "beneficiario",
        "prima",
        "deducible",
        "cobertura",
        "clausulado",
        "vigencia",
        "certificado",
        "endoso",
        "siniestro",
        "reclamación",
        "reclamacion",
        "exclusión",
        "exclusion",
        "suma asegurada",
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
        "policy",
        "insurance",
        "insurer",
        "insured",
        "holder",
        "premium",
        "deductible",
        "coverage",
        "endorsement",
        "claim",
        "beneficiary",
        "apólice",
        "apolice",
        "seguradora",
        "segurado",
        "prêmio",
        "premio",
        "franquia",
        "cobertura",
        "vigência",
        "vigencia",
    }
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
