import { describe, expect, it } from 'vitest'

import {
  benefitAlreadyMentioned,
  getCommonBenefitsForPolicyType,
} from '@/lib/policies/common-benefits-catalog'

describe('common benefits catalog', () => {
  it('returns health-specific benefits for health policies', () => {
    const benefits = getCommonBenefitsForPolicyType('health')
    expect(benefits.some((item) => item.id === 'hospitalization')).toBe(true)
  })

  it('detects when a benefit label is already in coverages text', () => {
    expect(
      benefitAlreadyMentioned(
        'Incluye hospitalización y medicamentos.',
        'Hospitalización'
      )
    ).toBe(true)
    expect(
      benefitAlreadyMentioned('Cobertura básica.', 'Hospitalización')
    ).toBe(false)
  })
})
