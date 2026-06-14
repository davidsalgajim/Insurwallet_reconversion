"""Ensure worker Claude tool schema covers all extractable policy fields."""

from __future__ import annotations

from pipeline.claude_extractor import EXTRACTION_TOOL, _FIELD_KEYS
from pipeline.extraction_fields import (
    POLICY_EXTRACTION_FIELD_KEYS,
    PAYMENT_FREQUENCY_VALUES,
    POLICY_TYPE_VALUES,
)


def test_field_keys_match_canonical_list() -> None:
    assert tuple(_FIELD_KEYS) == POLICY_EXTRACTION_FIELD_KEYS


def test_tool_schema_includes_all_extraction_fields() -> None:
    tool_props = set(EXTRACTION_TOOL["input_schema"]["properties"].keys())
    assert tool_props == set(POLICY_EXTRACTION_FIELD_KEYS)


def test_policy_type_enum_matches_schema() -> None:
    enum = EXTRACTION_TOOL["input_schema"]["properties"]["policyType"]["enum"]
    assert enum == list(POLICY_TYPE_VALUES)


def test_payment_frequency_enum_matches_schema() -> None:
    enum = EXTRACTION_TOOL["input_schema"]["properties"]["paymentFrequency"]["enum"]
    assert enum == list(PAYMENT_FREQUENCY_VALUES)
