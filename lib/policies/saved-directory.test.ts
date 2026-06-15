import { describe, expect, it } from 'vitest'

import {
  appendUniqueManualBeneficiaryRows,
  contactToAgentFields,
  filterAdvisorContacts,
  formatGlobalBeneficiaryNotes,
  globalBeneficiaryToManualRow,
  isAdvisorAlreadySaved,
  manualRowToGlobalBeneficiaryInput,
} from '@/lib/policies/saved-directory'

describe('saved-directory helpers', () => {
  it('filters advisor contacts only', () => {
    const contacts = filterAdvisorContacts([
      { id: '1', type: 'agent', name: 'Ana' },
      { id: '2', type: 'insurer', name: 'Bolívar' },
    ])

    expect(contacts).toHaveLength(1)
    expect(contacts[0]?.name).toBe('Ana')
  })

  it('maps advisor contact to agent fields', () => {
    expect(
      contactToAgentFields({
        id: '1',
        type: 'agent',
        name: 'Ana Pérez',
        phone: '+57 300',
        email: 'ana@demo.com',
      })
    ).toEqual({
      agentName: 'Ana Pérez',
      agentPhone: '+57 300',
      agentEmail: 'ana@demo.com',
      insurerContactRows: [],
    })
  })

  it('formats global beneficiary notes', () => {
    expect(
      formatGlobalBeneficiaryNotes({
        idType: 'cc',
        idNumber: '123',
        relationship: 'Cónyuge',
      })
    ).toBe('Cónyuge · CC: 123')
  })

  it('maps global beneficiary to manual row', () => {
    expect(
      globalBeneficiaryToManualRow({
        id: 'b1',
        name: 'María',
        idType: 'cc',
        idNumber: '99',
        relationship: 'Hija',
        pct: 50,
      })
    ).toEqual({
      name: 'María',
      pct: 50,
      observations: 'Hija · CC: 99',
    })
  })

  it('appends unique manual beneficiary rows', () => {
    const existing = [{ key: 'a', name: 'María', pct: 50, observations: '' }]
    const next = appendUniqueManualBeneficiaryRows(existing, [
      { name: 'María', pct: 25, observations: '' },
      { name: 'Pedro', pct: 25, observations: '' },
    ])

    expect(next).toHaveLength(2)
    expect(next[1]?.name).toBe('Pedro')
  })

  it('builds global beneficiary input from manual row', () => {
    expect(
      manualRowToGlobalBeneficiaryInput({
        name: 'Pedro',
        pct: 40,
        observations: 'Hijo',
      })
    ).toEqual({
      name: 'Pedro',
      idType: 'other',
      idNumber: '—',
      relationship: 'Hijo',
      pct: 40,
    })
  })

  it('detects duplicate saved advisors', () => {
    const contacts = [
      {
        id: '1',
        type: 'agent' as const,
        name: 'Ana Pérez',
        phone: '+57 300',
        email: 'ana@demo.com',
      },
    ]

    expect(
      isAdvisorAlreadySaved(
        {
          agentName: 'Ana Pérez',
          agentPhone: '+57 300',
          agentEmail: '',
          insurerContactRows: [],
        },
        contacts
      )
    ).toBe(true)

    expect(
      isAdvisorAlreadySaved(
        {
          agentName: 'Nuevo',
          agentPhone: '',
          agentEmail: '',
          insurerContactRows: [],
        },
        contacts
      )
    ).toBe(false)
  })
})
