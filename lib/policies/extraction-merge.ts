import type {
  ExtractionConfidence,
  PolicyExtraction,
  PolicyExtractionFields,
} from '@/lib/schemas/extraction'
import type {
  BenefitEntry,
  BeneficiaryEntry,
  CoverageEntry,
  DeductibleEntry,
} from '@/lib/schemas/policy'

const CONFIDENCE_RANK: Record<ExtractionConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

const SCALAR_FIELDS = [
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
] as const satisfies ReadonlyArray<keyof PolicyExtractionFields>

type ScalarField = (typeof SCALAR_FIELDS)[number]

function pickHigherConfidence<T>(
  current: { value: T; confidence: ExtractionConfidence } | undefined,
  candidate: { value: T; confidence: ExtractionConfidence }
): { value: T; confidence: ExtractionConfidence } {
  if (!current) {
    return candidate
  }

  return CONFIDENCE_RANK[candidate.confidence] >=
    CONFIDENCE_RANK[current.confidence]
    ? candidate
    : current
}

function mergeAgentFields(
  extractions: PolicyExtraction[]
): PolicyExtractionFields['agent'] | undefined {
  let name: { value: string; confidence: ExtractionConfidence } | undefined
  let phone: { value: string; confidence: ExtractionConfidence } | undefined
  let email: { value: string; confidence: ExtractionConfidence } | undefined

  for (const extraction of extractions) {
    const agent = extraction.fields.agent
    if (!agent) continue

    if (agent.name) {
      name = pickHigherConfidence(name, {
        value: agent.name,
        confidence: extraction.confidence['agent.name'] ?? 'low',
      })
    }
    if (agent.phone) {
      phone = pickHigherConfidence(phone, {
        value: agent.phone,
        confidence: extraction.confidence['agent.phone'] ?? 'low',
      })
    }
    if (agent.email) {
      email = pickHigherConfidence(email, {
        value: agent.email,
        confidence: extraction.confidence['agent.email'] ?? 'low',
      })
    }
  }

  if (!name && !phone && !email) {
    return undefined
  }

  return {
    ...(name ? { name: name.value } : {}),
    ...(phone ? { phone: phone.value } : {}),
    ...(email ? { email: email.value } : {}),
  }
}

function mergeUniqueByKey<T extends { name: string }>(arrays: T[][]): T[] {
  const seen = new Set<string>()
  const merged: T[] = []

  for (const array of arrays) {
    for (const item of array) {
      const key = item.name.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }

  return merged
}

function mergeDeductibles(arrays: DeductibleEntry[][]): DeductibleEntry[] {
  const seen = new Set<string>()
  const merged: DeductibleEntry[] = []

  for (const array of arrays) {
    for (const item of array) {
      const key = `${item.incidentType}:${item.amount}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }

  return merged
}

/** Merge multiple document extractions, preferring higher-confidence scalar fields. */
export function mergePolicyExtractions(
  extractions: Array<PolicyExtraction | undefined>
): PolicyExtraction | undefined {
  const valid = extractions.filter((item): item is PolicyExtraction =>
    Boolean(item)
  )

  if (valid.length === 0) {
    return undefined
  }

  if (valid.length === 1) {
    return valid[0]
  }

  const fields: PolicyExtractionFields = {}
  const confidence: Record<string, ExtractionConfidence> = {}
  const bboxes: NonNullable<PolicyExtraction['bboxes']> = {}

  for (const field of SCALAR_FIELDS) {
    let best:
      | {
          value: PolicyExtractionFields[ScalarField]
          confidence: ExtractionConfidence
        }
      | undefined

    for (const extraction of valid) {
      const value = extraction.fields[field]
      if (value === undefined) continue

      best = pickHigherConfidence(best, {
        value,
        confidence: extraction.confidence[field] ?? 'low',
      })
    }

    if (best) {
      ;(fields as Record<string, unknown>)[field] = best.value
      confidence[field] = best.confidence

      for (const extraction of valid) {
        const bbox = extraction.bboxes?.[field]
        if (
          bbox &&
          (extraction.confidence[field] ?? 'low') === best.confidence
        ) {
          bboxes[field] = bbox
          break
        }
      }
    }
  }

  const agent = mergeAgentFields(valid)
  if (agent) {
    fields.agent = agent
  }

  fields.coverageEntries = mergeUniqueByKey<CoverageEntry>(
    valid.map((e) => e.fields.coverageEntries ?? [])
  )
  fields.deductibleEntries = mergeDeductibles(
    valid.map((e) => e.fields.deductibleEntries ?? [])
  )
  fields.beneficiaryEntries = mergeUniqueByKey<BeneficiaryEntry>(
    valid.map((e) => e.fields.beneficiaryEntries ?? [])
  )
  fields.benefitEntries = mergeUniqueByKey<BenefitEntry>(
    valid.map((e) => e.fields.benefitEntries ?? [])
  )

  const latest = valid.reduce((acc, item) =>
    item.extractedAt > acc.extractedAt ? item : acc
  )

  return {
    fields,
    confidence,
    ...(Object.keys(bboxes).length > 0 ? { bboxes } : {}),
    method: latest.method,
    extractedAt: latest.extractedAt,
  }
}
