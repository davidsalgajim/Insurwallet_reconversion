/**
 * Canonical list of policy fields extractable from documents.
 * Mirrors worker/pipeline/extraction_fields.py and PolicyExtractionFieldsSchema.
 *
 * Excluded (app/system — never from PDF): ownerUid, sharedWith, status, createdAt, updatedAt.
 */
import type { PolicyExtractionFields } from '@/lib/schemas/extraction'
import type { Policy } from '@/lib/schemas/policy'

/** Policy schema keys that are never populated by document extraction. */
export const POLICY_SYSTEM_ONLY_FIELDS = [
  'ownerUid',
  'sharedWith',
  'status',
  'createdAt',
  'updatedAt',
] as const satisfies ReadonlyArray<keyof Policy>

/** Scalar + structured fields the worker / Claude tool may return. */
export const POLICY_EXTRACTION_FIELD_KEYS = [
  'insurerName',
  'policyNumber',
  'policyType',
  'holderName',
  'startDate',
  'endDate',
  'hasNoExpiration',
  'premium',
  'currency',
  'paymentFrequency',
  'coverages',
  'beneficiaries',
  'exclusions',
  'waitingPeriods',
  'notes',
  'agent',
  'coverageEntries',
  'deductibleEntries',
  'beneficiaryEntries',
  'benefitEntries',
] as const satisfies ReadonlyArray<keyof PolicyExtractionFields>

export type PolicyExtractionFieldKey =
  (typeof POLICY_EXTRACTION_FIELD_KEYS)[number]
