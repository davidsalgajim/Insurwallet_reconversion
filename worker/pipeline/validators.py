"""Post-IA validators ported from DocumentProcessingService+Extraction.swift."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Literal

ConfidenceLevel = Literal["high", "medium", "low"]

POLICY_NUMBER_PATTERN = re.compile(
    r"^[A-Z0-9][A-Z0-9\-./]{4,24}[A-Z0-9]$",
    re.IGNORECASE,
)
LOOSE_POLICY_NUMBER = re.compile(r"[A-Z0-9\-./]{5,30}", re.IGNORECASE)
DATE_PATTERNS = (
    re.compile(r"^(\d{4})-(\d{2})-(\d{2})$"),
    re.compile(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$"),
)
PREMIUM_MIN = 1.0
PREMIUM_MAX = 500_000_000.0
CURRENCY_PATTERN = re.compile(r"^[A-Z]{3}$")
INSURER_MIN_LEN = 2
HOLDER_MIN_LEN = 2


@dataclass(frozen=True)
class ValidatedField:
    value: str | float | None
    confidence: ConfidenceLevel
    issues: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ValidationResult:
    fields: dict[str, ValidatedField]
    confidence: dict[str, ConfidenceLevel]

    def to_confidence_dict(self) -> dict[str, ConfidenceLevel]:
        return dict(self.confidence)


def _parse_date(value: str | None) -> date | None:
    if not value or not isinstance(value, str):
        return None
    trimmed = value.strip()
    for pattern in DATE_PATTERNS:
        match = pattern.match(trimmed)
        if not match:
            continue
        if pattern.pattern.startswith("^(\d{4})"):
            year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
        else:
            day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
        try:
            return date(year, month, day)
        except ValueError:
            return None
    try:
        return datetime.fromisoformat(trimmed.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def validate_policy_number(value: str | None) -> ValidatedField:
    if not value or not str(value).strip():
        return ValidatedField(None, "low", ("missing",))
    normalized = str(value).strip().upper()
    if POLICY_NUMBER_PATTERN.match(normalized):
        return ValidatedField(normalized, "high")
    if LOOSE_POLICY_NUMBER.fullmatch(normalized):
        return ValidatedField(normalized, "medium", ("format_loose",))
    return ValidatedField(normalized, "low", ("format_invalid",))


def validate_insurer_name(value: str | None) -> ValidatedField:
    if not value or len(value.strip()) < INSURER_MIN_LEN:
        return ValidatedField(value, "low", ("missing_or_short",))
    cleaned = value.strip()
    if len(cleaned) >= 3 and not cleaned.isdigit():
        return ValidatedField(cleaned, "high")
    return ValidatedField(cleaned, "medium", ("suspicious",))


def validate_holder_name(value: str | None) -> ValidatedField:
    if not value or len(value.strip()) < HOLDER_MIN_LEN:
        return ValidatedField(None, "low", ("missing_or_short",))
    cleaned = value.strip()
    if re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", cleaned):
        return ValidatedField(cleaned, "high")
    return ValidatedField(cleaned, "medium", ("no_letters",))


def validate_premium(value: float | int | str | None) -> ValidatedField:
    if value is None or value == "":
        return ValidatedField(None, "low", ("missing",))
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return ValidatedField(None, "low", ("not_numeric",))
    if amount < PREMIUM_MIN or amount > PREMIUM_MAX:
        return ValidatedField(amount, "low", ("out_of_range",))
    if amount >= 1000:
        return ValidatedField(amount, "high")
    return ValidatedField(amount, "medium", ("unusually_low",))


def validate_currency(value: str | None) -> ValidatedField:
    if not value:
        return ValidatedField(None, "medium", ("missing",))
    normalized = str(value).strip().upper()
    if CURRENCY_PATTERN.match(normalized):
        return ValidatedField(normalized, "high")
    return ValidatedField(normalized, "low", ("invalid_iso",))


def validate_date_field(
    value: str | None,
    *,
    peer: date | None = None,
    role: Literal["start", "end"] = "start",
) -> ValidatedField:
    parsed = _parse_date(value)
    if not parsed:
        return ValidatedField(value, "low", ("unparseable",))
    today = date.today()
    if parsed.year < 1990 or parsed.year > today.year + 10:
        return ValidatedField(value, "low", ("year_out_of_range",))
    confidence: ConfidenceLevel = "high"
    issues: list[str] = []
    if peer:
        if role == "start" and parsed > peer:
            confidence = "low"
            issues.append("start_after_end")
        if role == "end" and parsed < peer:
            confidence = "low"
            issues.append("end_before_start")
    return ValidatedField(value, confidence, tuple(issues))


def validate_extraction(raw: dict[str, object]) -> ValidationResult:
    """Validate Claude output and produce per-field confidence scores."""
    policy_number = validate_policy_number(
        raw.get("policyNumber") if isinstance(raw.get("policyNumber"), str) else None
    )
    insurer = validate_insurer_name(
        raw.get("insurerName") if isinstance(raw.get("insurerName"), str) else None
    )
    holder = validate_holder_name(
        raw.get("holderName") if isinstance(raw.get("holderName"), str) else None
    )
    premium = validate_premium(raw.get("premium"))
    currency = validate_currency(
        raw.get("currency") if isinstance(raw.get("currency"), str) else None
    )

    start_raw = raw.get("startDate")
    end_raw = raw.get("endDate")
    start_parsed = _parse_date(start_raw if isinstance(start_raw, str) else None)
    end_parsed = _parse_date(end_raw if isinstance(end_raw, str) else None)

    start = validate_date_field(
        start_raw if isinstance(start_raw, str) else None,
        peer=end_parsed,
        role="start",
    )
    end = validate_date_field(
        end_raw if isinstance(end_raw, str) else None,
        peer=start_parsed,
        role="end",
    )

    fields = {
        "insurerName": insurer,
        "policyNumber": policy_number,
        "holderName": holder,
        "premium": premium,
        "currency": currency,
        "startDate": start,
        "endDate": end,
    }

    confidence = {name: field.confidence for name, field in fields.items()}
    return ValidationResult(fields=fields, confidence=confidence)
