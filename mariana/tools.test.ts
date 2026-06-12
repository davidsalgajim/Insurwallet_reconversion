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
    endDate: '2026-01-01',
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
})
