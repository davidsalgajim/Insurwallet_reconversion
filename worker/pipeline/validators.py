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
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", re.IGNORECASE)
RAW_EMAIL_SCAN = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)
COLOMBIA_PHONE_PATTERN = re.compile(r"^\+?57[0-9]{8,10}$")
COLOMBIA_MOBILE_PATTERN = re.compile(r"^\+57[0-9]{10}$")
GENERIC_PHONE_PATTERN = re.compile(r"^\+?[0-9]{8,15}$")
CO_BOGOTA_PHONE_SCAN = re.compile(
    r"\(60[-\s]?1\)\s*([\d\s.\-]+)(?:\s*[Ee]xt\.?\s*(\d+))?",
    re.IGNORECASE,
)
CO_LANDLINE_SCAN = re.compile(
    r"(?:\+?57\s*)?1[\s.\-]?(\d{3}[\s.\-]?\d{2}[\s.\-]?\d{2})"
    r"(?:\s*[Ee]xt\.?\s*(\d+))?",
)
CO_MOBILE_SCAN = re.compile(
    r"(?:\+?57\s*)?(3\d{2})[\s.\-]?(\d{3})[\s.\-]?(\d{4})",
)
SAC_CONTEXT_PATTERN = re.compile(
    r"(?:servicio\s+al\s+cliente|sac|l[ií]nea\s+de\s+atenci[oó]n|"
    r"atenci[oó]n\s+al\s+cliente|customer\s+service)",
    re.IGNORECASE,
)
FIRMA_AUTORIZADA_PATTERN = re.compile(
    r"(?:firma\s+autorizada|authorized\s+signature)"
    r"\s*[:\-]?\s*"
    r"([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})",
    re.IGNORECASE,
)
FIRMA_NAME_ABOVE_PATTERN = re.compile(
    r"([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})\s*"
    r"(?:\n|\r\n?)\s*"
    r"(?:firma\s+autorizada|authorized\s+signature)\b",
    re.IGNORECASE,
)
COMPANY_NAME_MARKERS = re.compile(
    r"\b(s\.?a\.?|s\.?a\.?s\.?|ltda|inc|corp|seguros|insurance|compa[nñ][ií]a)\b",
    re.IGNORECASE,
)


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
        if pattern.pattern.startswith(r"^(\d{4})"):
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


def normalize_phone(value: str | None) -> str | None:
    if not value or not isinstance(value, str):
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    ext_suffix: str | None = None
    ext_match = re.search(r"\s+[Ee]xt\.?\s*(\d+)\s*$", trimmed)
    if ext_match:
        ext_suffix = ext_match.group(1)
        trimmed = trimmed[: ext_match.start()].strip()
    digits = re.sub(r"[^\d+]", "", trimmed)
    if digits.startswith("+"):
        normalized = "+" + re.sub(r"\D", "", digits[1:])
    else:
        normalized = re.sub(r"\D", "", digits)
        if normalized.startswith("601") and len(normalized) >= 10:
            normalized = f"57{normalized[2:10]}"
        elif len(normalized) == 10 and normalized.startswith("3"):
            normalized = f"57{normalized}"
        elif len(normalized) == 12 and normalized.startswith("57"):
            normalized = f"+{normalized}"
        elif len(normalized) == 11 and normalized.startswith("57"):
            normalized = f"+{normalized}"
        elif len(normalized) == 8 and normalized.startswith("1"):
            normalized = f"57{normalized}"
    if normalized and not normalized.startswith("+"):
        normalized = f"+{normalized}"
    if ext_suffix and normalized:
        return f"{normalized} ext {ext_suffix}"
    return normalized or None


def _is_sac_email(email: str) -> bool:
    lowered = email.lower()
    return any(
        token in lowered
        for token in (
            "servicio",
            "sac",
            "atencion",
            "atención",
            "cliente",
            "contacto",
            "info",
        )
    )


def extract_emails_from_text(text: str) -> list[str]:
    seen: set[str] = set()
    emails: list[str] = []
    for match in RAW_EMAIL_SCAN.finditer(text):
        email = match.group(0).strip().lower()
        if email in seen:
            continue
        seen.add(email)
        emails.append(email)
    sac = [e for e in emails if _is_sac_email(e)]
    return sac or emails


def _normalize_scanned_phone(raw: str, ext: str | None = None) -> str | None:
    normalized = normalize_phone(raw)
    if not normalized:
        return None
    if ext and ext.strip():
        return f"{normalized} ext {ext.strip()}"
    return normalized


def extract_phones_from_text(text: str) -> list[str]:
    seen: set[str] = set()
    phones: list[str] = []

    def add_phone(candidate: str | None) -> None:
        if not candidate or candidate in seen:
            return
        seen.add(candidate)
        phones.append(candidate)

    for match in CO_BOGOTA_PHONE_SCAN.finditer(text):
        local_digits = re.sub(r"\D", "", match.group(1))[:7]
        ext = match.group(2)
        if len(local_digits) == 7:
            add_phone(_normalize_scanned_phone(f"601{local_digits}", ext))

    for match in CO_LANDLINE_SCAN.finditer(text):
        local = re.sub(r"\D", "", match.group(1))
        ext = match.group(2)
        add_phone(_normalize_scanned_phone(f"1{local}", ext))

    for match in CO_MOBILE_SCAN.finditer(text):
        raw = f"{match.group(1)}{match.group(2)}{match.group(3)}"
        add_phone(normalize_phone(raw))

    return phones


def extract_firma_autorizada_name(text: str) -> str | None:
    above = FIRMA_NAME_ABOVE_PATTERN.search(text)
    if above:
        name = above.group(1).strip()
        if len(name) >= 4 and not COMPANY_NAME_MARKERS.search(name):
            return name

    match = FIRMA_AUTORIZADA_PATTERN.search(text)
    if not match:
        return None
    name = match.group(1).strip()
    if len(name) < 4 or COMPANY_NAME_MARKERS.search(name):
        return None
    if not re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", name):
        return None
    return name


def _pick_sac_email(text: str, emails: list[str]) -> str | None:
    for email in emails:
        if not _is_sac_email(email):
            continue
        idx = text.lower().find(email)
        if idx >= 0:
            window = text[max(0, idx - 120) : idx + len(email) + 40]
            if SAC_CONTEXT_PATTERN.search(window) or _is_sac_email(email):
                return email
    return next((e for e in emails if _is_sac_email(e)), None)


def _pick_sac_phone(text: str, phones: list[str]) -> str | None:
    for phone in phones:
        bare = phone.split(" ext ")[0]
        idx = text.find(bare.replace("+57", ""))
        if idx < 0:
            idx = text.find(bare)
        if idx >= 0:
            window = text[max(0, idx - 120) : idx + 80]
            if SAC_CONTEXT_PATTERN.search(window):
                return phone
    return phones[0] if phones else None


def extract_insurer_contacts_from_text(text: str) -> dict[str, str]:
    emails = extract_emails_from_text(text)
    phones = extract_phones_from_text(text)
    contacts: dict[str, str] = {}

    sac_email = _pick_sac_email(text, emails)
    if sac_email:
        contacts["email"] = sac_email

    sac_phone = _pick_sac_phone(text, phones)
    if sac_phone:
        contacts["phone"] = sac_phone

    if contacts and SAC_CONTEXT_PATTERN.search(text):
        contacts["label"] = "Servicio al cliente"

    return contacts


def boost_agent_from_text(
    fields: dict[str, object],
    raw_text: str,
) -> dict[str, object]:
    """Regex boost for agent / insurerContacts when Claude omits SAC lines."""
    if not raw_text.strip():
        return fields

    boosted = dict(fields)
    agent: dict[str, str] = {}
    if isinstance(boosted.get("agent"), dict):
        agent = dict(boosted["agent"])  # type: ignore[arg-type]

    insurer_contacts: dict[str, str] = {}
    if isinstance(boosted.get("insurerContacts"), dict):
        insurer_contacts = dict(boosted["insurerContacts"])  # type: ignore[arg-type]

    scanned_contacts = extract_insurer_contacts_from_text(raw_text)
    for key, value in scanned_contacts.items():
        insurer_contacts.setdefault(key, value)

    for key in ("phone", "email", "label"):
        raw_val = insurer_contacts.get(key)
        if isinstance(raw_val, str) and raw_val.strip():
            if key == "phone":
                insurer_contacts[key] = normalize_phone(raw_val) or raw_val.strip()
            else:
                insurer_contacts[key] = raw_val.strip()

    if insurer_contacts:
        boosted["insurerContacts"] = insurer_contacts

    for key in ("phone", "email"):
        if not agent.get(key):
            fallback = insurer_contacts.get(key)
            if fallback:
                agent[key] = fallback

    if not agent.get("name"):
        firma = extract_firma_autorizada_name(raw_text)
        if firma:
            agent["name"] = firma

    if agent:
        boosted["agent"] = agent

    return boosted


def validate_agent_name(value: str | None) -> ValidatedField:
    if not value or len(value.strip()) < 2:
        return ValidatedField(None, "low", ("missing_or_short",))
    cleaned = value.strip()
    lowered = cleaned.lower()
    if lowered in {"por definir", "n/a", "na", "pendiente", "tbd"}:
        return ValidatedField(None, "low", ("placeholder",))
    if re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", cleaned):
        return ValidatedField(cleaned, "high")
    return ValidatedField(cleaned, "medium", ("no_letters",))


def validate_agent_phone(value: str | None) -> ValidatedField:
    normalized = normalize_phone(value)
    if not normalized:
        return ValidatedField(None, "low", ("missing",))
    bare = normalized.split(" ext ")[0]
    if bare in {"+570000000000", "+57000000000"}:
        return ValidatedField(None, "low", ("placeholder",))
    if COLOMBIA_MOBILE_PATTERN.match(bare):
        return ValidatedField(normalized, "high")
    if COLOMBIA_PHONE_PATTERN.match(bare):
        return ValidatedField(normalized, "medium", ("landline_or_loose",))
    if GENERIC_PHONE_PATTERN.match(bare):
        return ValidatedField(normalized, "medium", ("format_loose",))
    return ValidatedField(normalized, "low", ("format_invalid",))


def validate_agent_email(value: str | None) -> ValidatedField:
    if not value or not str(value).strip():
        return ValidatedField(None, "low", ("missing",))
    cleaned = value.strip().lower()
    if cleaned in {"pendiente@example.com", "n/a", "na", "sin correo"}:
        return ValidatedField(None, "low", ("placeholder",))
    if EMAIL_PATTERN.match(cleaned):
        return ValidatedField(cleaned, "high")
    return ValidatedField(cleaned, "low", ("invalid_email",))


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


def _coerce_expiration_raw(raw: dict[str, object]) -> dict[str, object]:
    """Align start/end/hasNoExpiration before date validation."""
    start_raw = raw.get("startDate")
    end_raw = raw.get("endDate")
    has_no = raw.get("hasNoExpiration")

    if has_no is True:
        return {**raw, "endDate": None, "hasNoExpiration": True}

    if (
        start_raw
        and end_raw
        and str(start_raw).strip()
        and str(start_raw).strip() == str(end_raw).strip()
    ):
        adjusted = dict(raw)
        adjusted.pop("endDate", None)
        adjusted["hasNoExpiration"] = True
        return adjusted

    return raw


def validate_extraction(raw: dict[str, object]) -> ValidationResult:
    """Validate Claude output and produce per-field confidence scores."""
    raw = _coerce_expiration_raw(raw)
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

    agent_raw = raw.get("agent")
    agent_fields: dict[str, ValidatedField] = {}
    agent_confidence: dict[str, ConfidenceLevel] = {}
    if isinstance(agent_raw, dict):
        agent_name = validate_agent_name(
            agent_raw.get("name") if isinstance(agent_raw.get("name"), str) else None
        )
        agent_phone = validate_agent_phone(
            agent_raw.get("phone") if isinstance(agent_raw.get("phone"), str) else None
        )
        agent_email = validate_agent_email(
            agent_raw.get("email") if isinstance(agent_raw.get("email"), str) else None
        )
        agent_fields = {
            "agent.name": agent_name,
            "agent.phone": agent_phone,
            "agent.email": agent_email,
        }
        agent_confidence = {
            "agent.name": agent_name.confidence,
            "agent.phone": agent_phone.confidence,
            "agent.email": agent_email.confidence,
        }

    fields = {
        "insurerName": insurer,
        "policyNumber": policy_number,
        "holderName": holder,
        "premium": premium,
        "currency": currency,
        "startDate": start,
        "endDate": end,
        **agent_fields,
    }

    confidence = {name: field.confidence for name, field in fields.items()}
    confidence.update(agent_confidence)
    return ValidationResult(fields=fields, confidence=confidence)
