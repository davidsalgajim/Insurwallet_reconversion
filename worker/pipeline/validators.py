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
    r"l[ií]nea\s+nacional|l[ií]nea\s+internacional|"
    r"atenci[oó]n\s+al\s+cliente|customer\s+service)",
    re.IGNORECASE,
)
ASSISTANCE_LINE_LABEL = re.compile(
    r"(?:asesor(?:ía)?(?:\s+comercial)?|agente|corredor|intermediario|sac|"
    r"servicio\s+al\s+cliente|l[ií]nea\s+(?:nacional|de\s+atenci[oó]n|internacional|directa)|"
    r"atenci[oó]n\s+al\s+cliente|whatsapp|emergencias|siniestros|"
    r"reporte\s+de\s+accidentes|defensor\s+del\s+consumidor|celular|m[oó]vil)",
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
TRAVEL_ASSISTANCE_CONTEXT = re.compile(
    r"(?:assist\s*card|e-?voucher|voucher|viaje|travel|asistencia|assistencia|"
    r"centrales|whatsapp\s+de\s+asistencia|ll[aá]manos)",
    re.IGNORECASE,
)
REGIONAL_ASSISTANCE_LABEL = re.compile(
    r"^(?:"
    r"Am[eé]rica\s+Latina|Latinoam[eé]rica|Norteam[eé]rica|"
    r"Asia|Europa|Colombia|M[eé]xico|Brasil|"
    r"Whatsapp(?:\s+de\s+asistencia)?|"
    r"Central(?:es)?(?:\s+de\s+asistencia)?"
    r")\s*$",
    re.IGNORECASE,
)
INTERNATIONAL_PHONE_LINE = re.compile(
    r"(?:\+?\d{1,3}[\s.\-]?)?"
    r"(?:\(?\d{1,4}\)?[\s.\-]?)?"
    r"(?:\d[\s.\-]?){6,14}\d",
)
TOLL_FREE_PHONE = re.compile(
    r"(?:\+?1[\s.\-]?)?(?:800|888|877|866)[\s.\-]?\d{3}[\s.\-]?\d{4}",
    re.IGNORECASE,
)
POLICY_NUMBER_MIN_COLLISION_LEN = 7


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


def _digits_only(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\D", "", value)


def phone_collides_with_policy_number(
    phone: str | None,
    policy_number: str | None,
) -> bool:
    """True when agent phone digits are likely the policy/certificate number."""
    if not phone or not policy_number:
        return False
    bare = phone.split(" ext ")[0]
    phone_digits = _digits_only(bare)
    policy_digits = _digits_only(policy_number)
    if len(phone_digits) < POLICY_NUMBER_MIN_COLLISION_LEN:
        return False
    if not policy_digits:
        return False
    if phone_digits == policy_digits:
        return True
    if phone_digits in policy_digits or policy_digits in phone_digits:
        return len(min(phone_digits, policy_digits, key=len)) >= (
            POLICY_NUMBER_MIN_COLLISION_LEN
        )
    for prefix in ("57", "54", "1", "34", "82", "52", "55", "56", "51"):
        if phone_digits.startswith(prefix) and len(phone_digits) > len(prefix) + 6:
            local = phone_digits[len(prefix) :]
            if local in policy_digits and len(local) >= POLICY_NUMBER_MIN_COLLISION_LEN:
                return True
    return False


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


def _scan_international_phone(raw: str) -> str | None:
    candidate = raw.strip()
    if not candidate:
        return None
    toll_free = TOLL_FREE_PHONE.search(candidate)
    if toll_free:
        return normalize_phone(toll_free.group(0))
    match = INTERNATIONAL_PHONE_LINE.search(candidate)
    if not match:
        return None
    return normalize_phone(match.group(0))


def _infer_phone_label(text: str, phone: str) -> str | None:
    bare = phone.split(" ext ")[0]
    idx = text.find(bare.replace("+57", ""))
    if idx < 0:
        idx = text.find(bare)
    if idx < 0:
        return None
    window = text[max(0, idx - 120) : idx + 40]
    label_match = ASSISTANCE_LINE_LABEL.search(window)
    if label_match:
        return label_match.group(0).strip().title()
    if SAC_CONTEXT_PATTERN.search(window):
        return "Servicio al cliente"
    return None


def extract_labeled_phones_from_text(text: str) -> list[dict[str, str]]:
    """Extract phones with context labels from any policy type."""
    if not text.strip():
        return []

    contacts: list[dict[str, str]] = []
    seen_phones: set[str] = set()
    lines = text.splitlines()

    for index, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue

        label_match = ASSISTANCE_LINE_LABEL.search(line_stripped)
        regional_match = REGIONAL_ASSISTANCE_LABEL.match(line_stripped)
        if not label_match and not regional_match:
            continue

        label = line_stripped if regional_match else label_match.group(0).strip().title()
        phone_raw = _scan_international_phone(line_stripped)
        if not phone_raw:
            for offset in range(1, 4):
                if index + offset >= len(lines):
                    break
                candidate = lines[index + offset].strip()
                if not candidate:
                    continue
                if ASSISTANCE_LINE_LABEL.search(candidate) or REGIONAL_ASSISTANCE_LABEL.match(
                    candidate
                ):
                    break
                phone_raw = _scan_international_phone(candidate)
                if phone_raw:
                    break

        if not phone_raw or phone_raw in seen_phones:
            continue
        seen_phones.add(phone_raw)
        contacts.append({"label": label, "phone": phone_raw})

    for phone in extract_phones_from_text(text):
        if phone in seen_phones:
            continue
        label = _infer_phone_label(text, phone)
        if not label:
            continue
        seen_phones.add(phone)
        contacts.append({"label": label, "phone": phone})

    return contacts


def filter_insurer_contacts_policy_collision(
    contacts: list[dict[str, str]],
    policy_number: str | None,
) -> list[dict[str, str]]:
    filtered: list[dict[str, str]] = []
    for contact in contacts:
        phone = contact.get("phone")
        if phone and phone_collides_with_policy_number(phone, policy_number):
            continue
        filtered.append(contact)
    return filtered


def _contact_dedup_key(contact: dict[str, str]) -> str:
    phone = contact.get("phone", "").strip()
    email = contact.get("email", "").strip().lower()
    label = contact.get("label", "").strip().lower()
    return f"{phone}|{email}|{label}"


def _merge_insurer_contact_lists(
    *lists: list[dict[str, str]],
) -> list[dict[str, str]]:
    merged: list[dict[str, str]] = []
    seen: set[str] = set()
    for items in lists:
        for contact in items:
            key = _contact_dedup_key(contact)
            if key in seen:
                continue
            seen.add(key)
            merged.append(contact)
    return merged


def extract_regional_assistance_contacts(text: str) -> list[dict[str, str]]:
    """Parse travel/voucher regional assistance blocks (Assist Card, e-voucher, etc.)."""
    if not text.strip():
        return []
    if not TRAVEL_ASSISTANCE_CONTEXT.search(text):
        return []

    contacts: list[dict[str, str]] = []
    seen_phones: set[str] = set()
    lines = text.splitlines()

    for index, line in enumerate(lines):
        label_match = REGIONAL_ASSISTANCE_LABEL.match(line.strip())
        if not label_match:
            continue
        label = line.strip()
        phone_raw = ""
        for offset in range(1, 4):
            if index + offset >= len(lines):
                break
            candidate = lines[index + offset].strip()
            if not candidate:
                continue
            if REGIONAL_ASSISTANCE_LABEL.match(candidate):
                break
            phone = _scan_international_phone(candidate)
            if phone:
                phone_raw = phone
                break
        if not phone_raw or phone_raw in seen_phones:
            continue
        seen_phones.add(phone_raw)
        contacts.append({"label": label, "phone": phone_raw})

    if contacts:
        return contacts

    for match in INTERNATIONAL_PHONE_LINE.finditer(text):
        phone = normalize_phone(match.group(0))
        if not phone or phone in seen_phones:
            continue
        start = max(0, match.start() - 80)
        window = text[start : match.start()]
        if not TRAVEL_ASSISTANCE_CONTEXT.search(window):
            continue
        seen_phones.add(phone)
        contacts.append({"label": "Asistencia", "phone": phone})

    return contacts


def _merge_assistance_into_benefit_entries(
    fields: dict[str, object],
    contacts: list[dict[str, str]],
) -> None:
    if not contacts:
        return
    existing: list[dict[str, object]] = []
    raw = fields.get("benefitEntries")
    if isinstance(raw, list):
        existing = [dict(entry) for entry in raw if isinstance(entry, dict)]

    existing_names = {
        str(entry.get("name", "")).strip().lower()
        for entry in existing
        if entry.get("name")
    }
    for contact in contacts:
        label = contact.get("label", "Asistencia").strip()
        phone = contact.get("phone", "").strip()
        if not phone:
            continue
        benefit_name = f"Asistencia — {label}"
        key = benefit_name.lower()
        if key in existing_names:
            continue
        existing_names.add(key)
        existing.append(
            {
                "name": benefit_name,
                "category": "travel",
                "contactInfo": phone,
            }
        )
    if existing:
        fields["benefitEntries"] = existing


def extract_insurer_contacts_from_text(text: str) -> list[dict[str, str]]:
    if not text.strip():
        return []

    labeled = extract_labeled_phones_from_text(text)
    regional = extract_regional_assistance_contacts(text)
    contacts = _merge_insurer_contact_lists(labeled, regional)

    emails = extract_emails_from_text(text)
    sac_email = _pick_sac_email(text, emails)
    if sac_email:
        merged_sac = False
        for contact in contacts:
            label = contact.get("label", "").lower()
            if "servicio" in label or "sac" in label or label == "":
                contact["email"] = sac_email
                if not contact.get("label"):
                    contact["label"] = "Servicio al cliente"
                merged_sac = True
                break
        if not merged_sac:
            contacts.append(
                {"email": sac_email, "label": "Servicio al cliente"},
            )

    if not contacts:
        phones = extract_phones_from_text(text)
        sac_phone = _pick_sac_phone(text, phones)
        if sac_phone:
            contacts.append(
                {"phone": sac_phone, "label": "Servicio al cliente"},
            )

    return contacts


def _normalize_insurer_contacts_list(
    raw: object,
) -> list[dict[str, str]]:
    if isinstance(raw, dict):
        items: list[object] = [raw]
    elif isinstance(raw, list):
        items = raw
    else:
        return []

    contacts: list[dict[str, str]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        row: dict[str, str] = {}
        phone = normalize_phone(
            item.get("phone") if isinstance(item.get("phone"), str) else None
        )
        email_raw = item.get("email")
        email = (
            str(email_raw).strip().lower()
            if isinstance(email_raw, str) and "@" in str(email_raw)
            else ""
        )
        label_raw = item.get("label")
        label = str(label_raw).strip() if isinstance(label_raw, str) else ""
        if phone:
            row["phone"] = phone
        if email:
            row["email"] = email
        if label and "@" not in label:
            row["label"] = label
        if row:
            contacts.append(row)
    return contacts


def _pick_advisor_phone(contacts: list[dict[str, str]]) -> str | None:
    advisor_markers = (
        "asesor",
        "agente",
        "corredor",
        "intermediario",
        "celular",
        "móvil",
        "movil",
    )
    for contact in contacts:
        label = contact.get("label", "").lower()
        phone = contact.get("phone")
        if phone and any(marker in label for marker in advisor_markers):
            return phone
    return None


def boost_agent_from_text(
    fields: dict[str, object],
    raw_text: str,
) -> dict[str, object]:
    """Regex boost for agent / insurerContacts when Claude omits SAC lines."""
    if not raw_text.strip():
        return fields

    boosted = dict(fields)
    policy_number = (
        boosted.get("policyNumber")
        if isinstance(boosted.get("policyNumber"), str)
        else None
    )

    agent: dict[str, str] = {}
    if isinstance(boosted.get("agent"), dict):
        agent = dict(boosted["agent"])  # type: ignore[arg-type]

    insurer_contacts = _normalize_insurer_contacts_list(
        boosted.get("insurerContacts")
    )

    regional = extract_regional_assistance_contacts(raw_text)
    if regional:
        _merge_assistance_into_benefit_entries(boosted, regional)

    scanned = extract_insurer_contacts_from_text(raw_text)
    scanned = filter_insurer_contacts_policy_collision(scanned, policy_number)
    insurer_contacts = _merge_insurer_contact_lists(
        insurer_contacts,
        scanned,
    )

    if insurer_contacts:
        insurer_contacts = filter_insurer_contacts_policy_collision(
            insurer_contacts,
            policy_number,
        )
        boosted["insurerContacts"] = insurer_contacts

    primary_phone = _pick_advisor_phone(insurer_contacts)
    if not primary_phone and insurer_contacts:
        primary_phone = insurer_contacts[0].get("phone")
    primary_email = insurer_contacts[0].get("email") if insurer_contacts else None
    primary_label = insurer_contacts[0].get("label") if insurer_contacts else None

    for key, fallback in (
        ("phone", primary_phone),
        ("email", primary_email),
    ):
        if not agent.get(key) and fallback:
            agent[key] = fallback

    if agent.get("phone") and phone_collides_with_policy_number(
        str(agent["phone"]), policy_number
    ):
        agent.pop("phone", None)
        if primary_phone and not phone_collides_with_policy_number(
            primary_phone, policy_number
        ):
            agent["phone"] = primary_phone

    if not agent.get("name"):
        if primary_label and "@" not in primary_label:
            agent["name"] = primary_label
        else:
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
    if cleaned in {
        "pendiente@example.com",
        "n/a",
        "na",
        "none",
        "null",
        "sin correo",
        "no email",
    }:
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
    policy_number_raw = raw.get("policyNumber")
    policy_number = (
        str(policy_number_raw).strip()
        if isinstance(policy_number_raw, str)
        else None
    )

    if isinstance(agent_raw, dict):
        agent_name = validate_agent_name(
            agent_raw.get("name") if isinstance(agent_raw.get("name"), str) else None
        )
        agent_phone_raw = (
            agent_raw.get("phone") if isinstance(agent_raw.get("phone"), str) else None
        )
        if phone_collides_with_policy_number(agent_phone_raw, policy_number):
            agent_phone = ValidatedField(None, "low", ("policy_number_collision",))
        else:
            agent_phone = validate_agent_phone(agent_phone_raw)
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


EXTRACTION_STRING_SENTINELS = frozenset(
    {
        "none",
        "n/a",
        "na",
        "null",
        "nil",
        "sin email",
        "no email",
        "no aplica",
        "ninguno",
        "ninguna",
        "not available",
        "no disponible",
        "pendiente",
        "tbd",
        "por definir",
        "sin correo",
        "sin dato",
    }
)


def _normalize_optional_string(value: object | None) -> str | None:
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    if not trimmed or trimmed.lower() in EXTRACTION_STRING_SENTINELS:
        return None
    return trimmed


def _coerce_non_negative_number(value: object | None) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        number = float(value)
        return number if number >= 0 else None
    if isinstance(value, str):
        normalized = _normalize_optional_string(value)
        if not normalized:
            return None
        try:
            number = float(normalized.replace(",", ""))
        except ValueError:
            return None
        return number if number >= 0 else None
    return None


def _coerce_pct(value: object | None) -> float | None:
    amount = _coerce_non_negative_number(value)
    if amount is None:
        return None
    return min(amount, 100.0)


def _normalize_benefit_contact_info(value: object | None) -> str | None:
    trimmed = _normalize_optional_string(value)
    if not trimmed:
        return None
    if "@" in trimmed:
        lowered = trimmed.lower()
        if EMAIL_PATTERN.match(lowered):
            return lowered
        return None
    phone = normalize_phone(trimmed)
    if phone:
        return phone
    return trimmed


def _normalize_benefit_quantity(value: object | None) -> str | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        number = float(value)
        if number > 0 and number.is_integer():
            return str(int(number))
        return None
    if isinstance(value, str):
        trimmed = _normalize_optional_string(value)
        if not trimmed:
            return None
        try:
            number = float(trimmed.replace(",", ""))
        except ValueError:
            return trimmed
        if number > 0 and number.is_integer():
            return str(int(number))
        return trimmed
    return None


def _sanitize_beneficiary_entries(
    entries: object,
) -> list[dict[str, object]]:
    if not isinstance(entries, list):
        return []
    sanitized: list[dict[str, object]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        name = _normalize_optional_string(entry.get("name"))
        pct = _coerce_pct(entry.get("pct"))
        if not name or pct is None:
            continue
        row: dict[str, object] = {"name": name, "pct": pct}
        notes = _normalize_optional_string(entry.get("notes"))
        if notes:
            row["notes"] = notes
        sanitized.append(row)
    return sanitized


def _sanitize_coverage_entries(entries: object) -> list[dict[str, object]]:
    if not isinstance(entries, list):
        return []
    sanitized: list[dict[str, object]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        name = _normalize_optional_string(entry.get("name"))
        amount = _coerce_non_negative_number(entry.get("amount"))
        if not name or amount is None:
            continue
        sanitized.append({"name": name, "amount": amount})
    return sanitized


def _sanitize_deductible_entries(entries: object) -> list[dict[str, object]]:
    if not isinstance(entries, list):
        return []
    sanitized: list[dict[str, object]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        incident_type = _normalize_optional_string(entry.get("incidentType"))
        amount = _coerce_non_negative_number(entry.get("amount"))
        if not incident_type or amount is None:
            continue
        is_percentage = entry.get("isPercentage")
        sanitized.append(
            {
                "incidentType": incident_type,
                "amount": amount,
                "isPercentage": bool(is_percentage)
                if isinstance(is_percentage, bool)
                else False,
            }
        )
    return sanitized


def _sanitize_benefit_entries(entries: object) -> list[dict[str, object]]:
    if not isinstance(entries, list):
        return []
    sanitized: list[dict[str, object]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        name = _normalize_optional_string(entry.get("name"))
        if not name:
            continue
        row: dict[str, object] = {"name": name}
        description = _normalize_optional_string(entry.get("description"))
        if description:
            row["description"] = description
        category = _normalize_optional_string(entry.get("category"))
        if category:
            row["category"] = category
        contact_info = _normalize_benefit_contact_info(entry.get("contactInfo"))
        if contact_info:
            row["contactInfo"] = contact_info
        quantity = _normalize_benefit_quantity(entry.get("quantity"))
        if quantity:
            row["quantity"] = quantity
        sanitized.append(row)
    return sanitized


def sanitize_structured_extraction_arrays(
    fields: dict[str, object],
) -> dict[str, object]:
    """Strip sentinel strings and invalid rows from structured extraction arrays."""
    sanitized = dict(fields)
    array_keys: tuple[tuple[str, object], ...] = (
        ("beneficiaryEntries", _sanitize_beneficiary_entries),
        ("coverageEntries", _sanitize_coverage_entries),
        ("deductibleEntries", _sanitize_deductible_entries),
        ("benefitEntries", _sanitize_benefit_entries),
    )
    for key, sanitizer in array_keys:
        if key in sanitized:
            sanitized[key] = sanitizer(sanitized[key])
    return sanitized
