import { Timestamp } from 'firebase-admin/firestore'

import type { Policy } from '@/lib/schemas/policy'
import type { PolicyExtractionFields } from '@/lib/schemas/extraction'
import { stripUndefined } from '@/lib/utils/strip-undefined'

/** Server-only: uses firebase-admin Timestamp (not client SDK). */
export function policyToAdminFirestoreData(
  policy: Policy
): Record<string, unknown> {
  return stripUndefined({
    ...policy,
    startDate: Timestamp.fromDate(policy.startDate),
    endDate: Timestamp.fromDate(policy.endDate),
    createdAt: Timestamp.fromDate(policy.createdAt),
    updatedAt: Timestamp.fromDate(policy.updatedAt),
  })
}

export function extractionFieldsToAdminFirestore(
  fields: PolicyExtractionFields
): Record<string, unknown> {
  return stripUndefined({
    ...fields,
    startDate: fields.startDate
      ? fields.startDate.toISOString().slice(0, 10)
      : undefined,
    endDate: fields.endDate
      ? fields.endDate.toISOString().slice(0, 10)
      : undefined,
  })
}
