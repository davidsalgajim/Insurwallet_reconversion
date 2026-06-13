import { describe, expect, it } from 'vitest'

import { assertPolicyAccess, executeTool } from '@/mariana/tools'

const context = {
  uid: 'owner-uid',
  ownedPolicyIds: ['policy-1', 'policy-2'],
  sharedPolicyIds: ['policy-shared'],
}

const policies = [
  {
    id: 'policy-1',
    policyNumber: 'POL-001',
    insurerName: 'Demo',
    policyType: 'auto',
    holderName: 'Jane',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    premium: 1000,
    currency: 'COP',
    paymentFrequency: 'annual',
    coverageCount: 0,
    deductibleCount: 0,
    beneficiaryCount: 0,
    benefitCount: 0,
  },
  {
    id: 'policy-2',
    policyNumber: 'POL-002',
    insurerName: 'Demo Health',
    policyType: 'health',
    holderName: 'Jane',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    premium: 2000,
    currency: 'COP',
    paymentFrequency: 'annual',
    coverageCount: 0,
    deductibleCount: 0,
    beneficiaryCount: 0,
    benefitCount: 0,
  },
]

describe('assertPolicyAccess', () => {
  it('allows owned and shared policy ids', () => {
    expect(() => assertPolicyAccess(context, 'policy-1')).not.toThrow()
    expect(() => assertPolicyAccess(context, 'policy-shared')).not.toThrow()
  })

  it('denies arbitrary policy ids from the client', () => {
    expect(() => assertPolicyAccess(context, 'policy-attacker')).toThrow(
      'Unauthorized policy access'
    )
  })
})

describe('executeTool', () => {
  it('returns read-only policy summaries scoped to uid', () => {
    const result = executeTool(
      { name: 'get_policies_summary' },
      context,
      policies
    )
    expect(result.readOnly).toBe(true)
    expect(result.data).toEqual(policies)
  })

  it('filters policies by type', () => {
    const result = executeTool(
      {
        name: 'get_policies_by_type',
        policyTypes: ['auto'],
      },
      context,
      policies
    )

    expect(result.data).toEqual({
      policyTypes: ['auto'],
      policies: [policies[0]],
    })
  })

  it('returns empty chunk search stub', () => {
    const result = executeTool(
      {
        name: 'search_document_chunks',
        policyId: 'policy-1',
        query: 'exclusion',
      },
      context
    )
    expect(result.data).toEqual({
      policyId: 'policy-1',
      query: 'exclusion',
      chunks: [],
    })
  })

  it('rejects unauthorized policy access in tools', () => {
    expect(() =>
      executeTool(
        { name: 'get_coverage_details', policyId: 'policy-attacker' },
        context
      )
    ).toThrow('Unauthorized policy access')
  })

  it('does not leak policies outside uid scope in summaries', () => {
    const outsiderPolicies = [
      ...policies,
      {
        ...policies[0]!,
        id: 'policy-attacker',
      },
    ]

    const result = executeTool(
      { name: 'get_policies_summary' },
      context,
      outsiderPolicies
    )

    expect(result.data).toEqual(policies)
  })
})
