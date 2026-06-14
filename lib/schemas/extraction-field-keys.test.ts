import { describe, expect, it } from 'vitest'

import {
  POLICY_EXTRACTION_FIELD_KEYS,
  POLICY_SYSTEM_ONLY_FIELDS,
} from '@/lib/schemas/extraction-field-keys'
import { PolicyExtractionFieldsSchema } from '@/lib/schemas/extraction'
import { PolicySchema } from '@/lib/schemas/policy'

describe('policy extraction field parity', () => {
  it('PolicyExtractionFieldsSchema keys match canonical extraction list', () => {
    const schemaKeys = Object.keys(PolicyExtractionFieldsSchema.shape).sort()
    const canonical = [...POLICY_EXTRACTION_FIELD_KEYS].sort()
    expect(schemaKeys).toEqual(canonical)
  })

  it('every user-editable Policy field is either extractable or system-only', () => {
    const policyKeys = Object.keys(PolicySchema.shape)
    const accounted = new Set([
      ...POLICY_EXTRACTION_FIELD_KEYS,
      ...POLICY_SYSTEM_ONLY_FIELDS,
    ])

    for (const key of policyKeys) {
      expect(accounted.has(key as never)).toBe(true)
    }
  })
})
