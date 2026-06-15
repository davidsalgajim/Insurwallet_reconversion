"""Canonical extractable policy fields — mirrors lib/schemas/extraction-field-keys.ts."""

from __future__ import annotations

# Keep in sync with PolicyTypeSchema (lib/schemas/policy.ts)
POLICY_TYPE_VALUES: tuple[str, ...] = (
    "life",
    "health",
    "auto",
    "home",
    "travel",
    "pet",
    "funeral",
    "dental",
    "business",
    "other",
)

# Keep in sync with PaymentFrequencySchema
PAYMENT_FREQUENCY_VALUES: tuple[str, ...] = (
    "monthly",
    "quarterly",
    "semi_annual",
    "annual",
    "single",
)

# User-editable policy fields; excludes ownerUid, sharedWith, status, createdAt, updatedAt
POLICY_EXTRACTION_FIELD_KEYS: tuple[str, ...] = (
    "insurerName",
    "policyNumber",
    "policyType",
    "holderName",
    "startDate",
    "endDate",
    "hasNoExpiration",
    "premium",
    "currency",
    "paymentFrequency",
    "coverages",
    "beneficiaries",
    "exclusions",
    "waitingPeriods",
    "notes",
    "agent",
    "insurerContacts",
    "coverageEntries",
    "deductibleEntries",
    "beneficiaryEntries",
    "benefitEntries",
)

POLICY_SYSTEM_ONLY_FIELDS: tuple[str, ...] = (
    "ownerUid",
    "sharedWith",
    "status",
    "createdAt",
    "updatedAt",
)
