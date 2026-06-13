import { describe, expect, it } from 'vitest'

import {
  searchBenefitsAssistances,
  searchCoverageForEvent,
} from '@/mariana/event-search'
import { makeMarianaPolicyContext } from '@/mariana/test-fixtures'

describe('searchBenefitsAssistances', () => {
  it('matches asistencias and servicios synonyms in benefit entries', () => {
    const policies = [
      makeMarianaPolicyContext({
        id: 'home-1',
        policyType: 'home',
        benefitEntries: [
          {
            name: 'Asistencia plomería 24h',
            description: 'Servicios de emergencia en domicilio',
            category: 'asistencias',
            contactInfo: '+571234567',
            quantity: '3 eventos/año',
          },
        ],
      }),
    ]

    const byAsistencia = searchBenefitsAssistances(
      policies,
      'asistencia hogar',
      ['home']
    )
    expect(byAsistencia).toHaveLength(1)

    const byServicios = searchBenefitsAssistances(
      policies,
      'servicios plomeria',
      ['home']
    )
    expect(byServicios).toHaveLength(1)
  })
})

describe('searchCoverageForEvent', () => {
  it('scopes results to requested policy types', () => {
    const policies = [
      makeMarianaPolicyContext({
        id: 'travel-1',
        policyType: 'travel',
        coverageEntries: [{ name: 'Baggage loss', amount: 1000 }],
      }),
      makeMarianaPolicyContext({
        id: 'auto-1',
        policyType: 'auto',
        coverageEntries: [{ name: 'Collision', amount: 5_000_000 }],
      }),
    ]

    const matches = searchCoverageForEvent(policies, 'equipaje viaje', [
      'travel',
    ])
    expect(matches).toHaveLength(1)
    expect(matches[0]?.policyType).toBe('travel')
  })
})
