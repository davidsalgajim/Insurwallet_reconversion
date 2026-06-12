"""Anti prompt-injection sanitizer for extracted document text.

Findings are recorded explicitly; suspicious imperative patterns are flagged
but not silently removed. Zero-width characters are stripped after logging.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Literal

FindingKind = Literal["zero_width", "imperative_pattern"]

# Zero-width and invisible formatting characters common in injection attacks.
ZERO_WIDTH_CHARS = frozenset(
    "\u200b\u200c\u200d\u2060\ufeff\u00ad\u180e\u2061\u2062\u2063\u2064"
)

# Case-insensitive imperative / jailbreak patterns (English + common Spanish).
IMPERATIVE_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = tuple(
    (
        label,
        re.compile(pattern, re.IGNORECASE | re.MULTILINE),
    )
    for label, pattern in (
        (
            "ignore_previous_instructions",
            r"\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|prompts?|rules?)\b",
        ),
        (
            "disregard_instructions",
            r"\bdisregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|context)\b",
        ),
        (
            "forget_instructions",
            r"\bforget\s+(?:everything|all|your)\s+(?:instructions?|rules?|training)\b",
        ),
        (
            "system_role_prefix",
            r"(?:^|\n)\s*system\s*:\s*",
        ),
        (
            "assistant_role_prefix",
            r"(?:^|\n)\s*assistant\s*:\s*",
        ),
        (
            "act_as_override",
            r"\bact\s+as\s+(?:a\s+)?(?:system|admin(?:istrator)?|root|developer)\b",
        ),
        (
            "you_are_now",
            r"\byou\s+are\s+now\s+(?:a\s+)?(?:(?:unrestricted|helpful)\s+)?(?:ai|assistant|model)\b",
        ),
        (
            "new_instructions",
            r"\bnew\s+instructions?\s*:\s*",
        ),
        (
            "override_instructions",
            r"\boverride\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|rules?|safety)\b",
        ),
        (
            "do_not_follow",
            r"\bdo\s+not\s+follow\s+(?:your|the)\s+(?:instructions?|rules?|guidelines?)\b",
        ),
        (
            "reveal_system_prompt",
            r"\breveal\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?)\b",
        ),
        (
            "jailbreak_dan",
            r"\b(?:jailbreak|DAN\s+mode|developer\s+mode)\b",
        ),
        (
            "ignore_instrucciones_es",
            r"\bignora\s+(?:todas?\s+)?(?:las\s+)?(?:instrucciones?|reglas?)\s+(?:anteriores|previas)\b",
        ),
        (
            "olvida_instrucciones_es",
            r"\bolvida\s+(?:todo|tus)\s+(?:instrucciones?|reglas?)\b",
        ),
    )
)


@dataclass(frozen=True)
class SanitizerFinding:
    kind: FindingKind
    start: int
    end: int
    detail: str
    excerpt: str


@dataclass(frozen=True)
class SanitizeResult:
    text: str
    findings: tuple[SanitizerFinding, ...] = field(default_factory=tuple)
    has_suspicious_content: bool = False

    @property
    def zero_width_count(self) -> int:
        return sum(1 for finding in self.findings if finding.kind == "zero_width")

    @property
    def imperative_count(self) -> int:
        return sum(
            1 for finding in self.findings if finding.kind == "imperative_pattern"
        )


def _excerpt(text: str, start: int, end: int, *, radius: int = 24) -> str:
    slice_start = max(0, start - radius)
    slice_end = min(len(text), end + radius)
    return text[slice_start:slice_end].replace("\n", "\\n")


def _find_zero_width(text: str) -> list[SanitizerFinding]:
    findings: list[SanitizerFinding] = []
    for index, char in enumerate(text):
        if char in ZERO_WIDTH_CHARS:
            findings.append(
                SanitizerFinding(
                    kind="zero_width",
                    start=index,
                    end=index + 1,
                    detail=f"U+{ord(char):04X}",
                    excerpt=_excerpt(text, index, index + 1),
                )
            )
    return findings


def _strip_zero_width(text: str) -> str:
    return "".join(char for char in text if char not in ZERO_WIDTH_CHARS)


def _find_imperative_patterns(text: str) -> list[SanitizerFinding]:
    findings: list[SanitizerFinding] = []
    for label, pattern in IMPERATIVE_PATTERNS:
        for match in pattern.finditer(text):
            findings.append(
                SanitizerFinding(
                    kind="imperative_pattern",
                    start=match.start(),
                    end=match.end(),
                    detail=label,
                    excerpt=_excerpt(text, match.start(), match.end()),
                )
            )
    findings.sort(key=lambda finding: (finding.start, finding.end))
    return findings


def sanitize_document_text(raw_text: str) -> SanitizeResult:
    """Normalize Unicode, strip zero-width chars, and flag imperative patterns."""
    if not raw_text:
        return SanitizeResult(text="")

    normalized = unicodedata.normalize("NFKC", raw_text)
    zero_width_findings = _find_zero_width(normalized)
    stripped = _strip_zero_width(normalized)
    imperative_findings = _find_imperative_patterns(stripped)

    findings = tuple(zero_width_findings + imperative_findings)
    has_suspicious = bool(zero_width_findings or imperative_findings)

    return SanitizeResult(
        text=stripped,
        findings=findings,
        has_suspicious_content=has_suspicious,
    )
