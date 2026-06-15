import { describe, expect, it } from 'vitest'

import {
  matchEmergencyKeywords,
  matchSituationalIntent,
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
  makePolicyMetadata({
    id: 'policy-health',
    policyNumber: 'HLTH-001',
    insurerName: 'Sura',
    policyType: 'health',
    endDate: '2026-12-01',
  }),
  makePolicyMetadata({
    id: 'policy-home',
    policyNumber: 'HOME-001',
    insurerName: 'Mapfre',
    policyType: 'home',
    endDate: '2026-08-01',
  }),
]

describe('matchEmergencyKeywords', () => {
  it('detects emergency keywords in Spanish and English', () => {
    expect(matchEmergencyKeywords('Tuve un accidente ayer')).toBe(true)
    expect(matchEmergencyKeywords('I need help after a theft')).toBe(true)
    expect(matchEmergencyKeywords('Me estrellé en la autopista')).toBe(true)
    expect(matchEmergencyKeywords('¿Qué cubre mi póliza?')).toBe(false)
  })
})

describe('matchSituationalIntent', () => {
  it('classifies accident, health, and home scenarios', () => {
    expect(matchSituationalIntent('Me estrellé en Bogotá')?.intent).toBe(
      'emergency_accident'
    )
    expect(matchSituationalIntent('Tengo cáncer de próstata')?.intent).toBe(
      'health_event'
    )
    expect(matchSituationalIntent('Se me rompió una tubería')?.intent).toBe(
      'home_assistance'
    )
  })
})

describe('matchTier0Intent', () => {
  it('matches expiry, premium, and contact intents', () => {
    expect(matchTier0Intent('¿Cuándo vence mi póliza de auto?')).toBe(
      'policy_expiry'
    )
    expect(matchTier0Intent('que polizas vencidas tengo hoy')).toBe(
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
  it('routes car accidents to emergency with auto policy hint', () => {
    const decision = routeMessage('Me estrellé ayer', samplePolicies)
    expect(decision.agent).toBe('emergency')
    expect(decision.entities.situationalIntent).toBe('emergency_accident')
    expect(decision.entities.policyTypes).toEqual(['auto'])
    expect(decision.entities.policyHint).toBe('policy-auto')
  })

  it('routes emergencies with highest priority', () => {
    const decision = routeMessage(
      'Tuve un accidente de tránsito',
      samplePolicies
    )
    expect(decision.agent).toBe('emergency')
    expect(decision.confidence).toBeGreaterThan(0.9)
  })

  it('routes health events to coverage agent', () => {
    const decision = routeMessage('Tengo cáncer de próstata', samplePolicies)
    expect(decision.agent).toBe('coverage')
    expect(decision.entities.situationalIntent).toBe('health_event')
    expect(decision.entities.policyHint).toBe('policy-health')
  })

  it('routes home assistance to coverage agent', () => {
    const decision = routeMessage(
      'Se me rompió una tubería en la cocina',
      samplePolicies
    )
    expect(decision.agent).toBe('coverage')
    expect(decision.entities.situationalIntent).toBe('home_assistance')
    expect(decision.entities.policyHint).toBe('policy-home')
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

  it('routes situational travel disruption to coverage with intent', () => {
    const decision = routeMessage('Perdí el equipaje en mi viaje')
    expect(decision.agent).toBe('coverage')
    expect(decision.entities.situationalIntent).toBe('travel_disruption')
    expect(decision.entities.policyTypes).toEqual(['travel'])
  })

  it('routes pet incidents without triggering auto emergency', () => {
    const decision = routeMessage('Mi perro necesita cirugía veterinaria')
    expect(decision.agent).toBe('coverage')
    expect(decision.entities.situationalIntent).toBe('pet_incident')
  })
})

describe('matchSituationalIntent re-export', () => {
  it('detects home assistance with asistencias wording', () => {
    const match = matchSituationalIntent(
      'Necesito asistencia de plomería en casa'
    )
    expect(match?.intent).toBe('home_assistance')
    expect(match?.policyTypes).toEqual(['home'])
  })
})
