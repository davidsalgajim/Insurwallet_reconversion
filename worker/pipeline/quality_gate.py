"""Quality gate — port of DocumentProcessingService.swift ~363 heuristics."""

from __future__ import annotations

import re

from pipeline.policy_lexicon import POLICY_DOCUMENT_KEYWORDS

MIN_WORD_COUNT = 100

POLICY_KEYWORDS: tuple[str, ...] = POLICY_DOCUMENT_KEYWORDS


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


_IMAGE_PLACEHOLDER = re.compile(r"^!\[image\s+\d+\]", re.IGNORECASE)


def is_low_signal_text(text: str) -> bool:
    """True when OCR/text extraction produced placeholders or no readable policy content."""
    stripped = text.strip()
    if not stripped:
        return True

    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    if not lines:
        return True

    placeholder_lines = sum(1 for line in lines if _IMAGE_PLACEHOLDER.match(line))
    if placeholder_lines / len(lines) >= 0.5:
        return True

    return needs_quality_escalation(stripped)
