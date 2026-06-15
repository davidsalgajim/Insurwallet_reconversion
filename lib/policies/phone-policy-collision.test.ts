import { describe, expect, it } from 'vitest'

import { phoneCollidesWithPolicyNumber } from '@/lib/policies/phone-policy-collision'

describe('phoneCollidesWithPolicyNumber', () => {
  const policyNumber = '570 17148300 0L01 LA111 / 1'

  it('flags Assist Card number formatted as Colombia phone', () => {
    expect(phoneCollidesWithPolicyNumber('+5717148300', policyNumber)).toBe(
      true
    )
  })

  it('allows real regional assistance numbers', () => {
    expect(phoneCollidesWithPolicyNumber('+18008742223', policyNumber)).toBe(
      false
    )
    expect(phoneCollidesWithPolicyNumber('+34917883333', policyNumber)).toBe(
      false
    )
  })
})
