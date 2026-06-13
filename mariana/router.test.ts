import { describe, expect, it } from 'vitest'

import {
  buildTier0Placeholder,
  matchEmergencyKeywords,
  matchTier0Intent,
  routeMessage,
} from '@/mariana/router'
import { makePolicyMetadata } from '@/mariana/test-fixtures'

const samplePolicies = [
  makePolicyMetadata({
    id: 'policy-auto',
    policyNumber: 'AUTO-001',
    insurerName: 'Seguros Bolívar',
    policyType: 'auto',
    endDate: '2026-06-01',
  }),
]

describe('matchEmergencyKeywords', () => {
  it('detects emergency keywords in Spanish and English', () => {
    expect(matchEmergencyKeywords('Tuve un accidente ayer')).toBe(true)
    expect(matchEmergencyKeywords('I need help after a theft')).toBe(true)
    expect(matchEmergencyKeywords('¿Qué cubre mi póliza?')).toBe(false)
  })
})

describe('matchTier0Intent', () => {
  it('matches expiry, premium, and contact intents', () => {
    expect(matchTier0Intent('¿Cuándo vence mi póliza de auto?')).toBe(
      'policy_expiry'
    )
    expect(matchTier0Intent('¿Cuánto pago de prima al mes?')).toBe(
      'premium_info'
    )
    expect(matchTier0Intent('¿A quién llamo en la aseguradora?')).toBe(
      'contact_info'
    )
    expect(matchTier0Intent('¿Qué beneficiarios tengo registrados?')).toBe(
      'beneficiary_info'
    )
  })

  it('returns null for non-tier0 questions', () => {
    expect(matchTier0Intent('¿Qué exclusiones tiene el clausulado?')).toBeNull()
  })
})

describe('routeMessage', () => {
  it('routes emergencies with highest priority', () => {
    const decision = routeMessage(
      'Tuve un accidente de tránsito',
      samplePolicies
    )
    expect(decision.agent).toBe('emergency')
    expect(decision.confidence).toBeGreaterThan(0.9)
  })

  it('routes tier0 intents without LLM', () => {
    const decision = routeMessage(
      '¿Cuándo vence mi seguro de auto?',
      samplePolicies
    )
    expect(decision.agent).toBe('tier0')
    expect(decision.tier0Intent).toBe('policy_expiry')
    expect(decision.entities.policyHint).toBe('policy-auto')
  })

  it('routes coverage questions to the coverage agent', () => {
    const decision = routeMessage('¿Estoy cubierto para un viaje?')
    expect(decision.agent).toBe('coverage')
  })

  it('routes clause questions to the documental agent', () => {
    const decision = routeMessage('¿Qué dice el clausulado sobre exclusiones?')
    expect(decision.agent).toBe('documental')
  })
})

describe('buildTier0Placeholder', () => {
  it('returns localized deterministic placeholders', () => {
    expect(buildTier0Placeholder('policy_expiry', 'en')).toContain('expiry')
    expect(buildTier0Placeholder('premium_info', 'es')).toContain('primas')
  })
})
