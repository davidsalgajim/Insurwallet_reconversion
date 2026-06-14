import {
  PolicyExtractionSchema,
  type PolicyExtraction,
} from '@/lib/schemas/extraction'

function firestoreValueToDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  return undefined
}

function normalizeExtractionFields(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const normalized = { ...fields }
  const startDate = firestoreValueToDate(fields.startDate)
  const endDate = firestoreValueToDate(fields.endDate)

  if (startDate) {
    normalized.startDate = startDate
  }
  if (endDate) {
    normalized.endDate = endDate
  }

  return normalized
}

/** Parse `policies/{id}/documents/{docId}.extraction` from Firestore client reads. */
export function parseDocumentExtraction(
  data: Record<string, unknown>
): PolicyExtraction | undefined {
  if (!data.extraction || typeof data.extraction !== 'object') {
    return undefined
  }

  const raw = data.extraction as Record<string, unknown>
  const extractedAt = firestoreValueToDate(raw.extractedAt) ?? raw.extractedAt

  const fields =
    raw.fields && typeof raw.fields === 'object'
      ? normalizeExtractionFields(raw.fields as Record<string, unknown>)
      : raw.fields

  const parsed = PolicyExtractionSchema.safeParse({
    ...raw,
    fields,
    extractedAt,
  })

  if (!parsed.success && process.env.NODE_ENV === 'development') {
    console.warn(
      '[parseDocumentExtraction] invalid extraction payload',
      parsed.error.flatten()
    )
  }

  return parsed.success ? parsed.data : undefined
}
