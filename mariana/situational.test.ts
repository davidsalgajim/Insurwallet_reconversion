import { describe, expect, it } from 'vitest'

import {
  ASSISTANCE_KEYWORDS,
  matchSituationalIntent,
  primaryPolicyTypeForIntent,
  SITUATIONAL_POLICY_TYPES,
  usesAssistancePrefetch,
} from '@/mariana/situational'
import { PolicyTypeSchema } from '@/lib/schemas/policy'
import { SITUATIONAL_INTENTS } from '@/mariana/types'

describe('situational intents cover all policy types', () => {
  it('maps every situational intent to at least one policy type', () => {
    for (const intent of SITUATIONAL_INTENTS) {
      expect(SITUATIONAL_POLICY_TYPES[intent].length).toBeGreaterThan(0)
    }
  })

  it('covers all 10 policy types across situational mappings', () => {
    const covered = new Set(
      SITUATIONAL_INTENTS.flatMap((intent) => [
        ...SITUATIONAL_POLICY_TYPES[intent],
      ])
    )
    for (const policyType of PolicyTypeSchema.options) {
      expect(covered.has(policyType)).toBe(true)
    }
  })
})

describe('matchSituationalIntent', () => {
  it('detects auto accident and business incidents separately', () => {
    expect(matchSituationalIntent('Choque en la autopista')?.intent).toBe(
      'emergency_accident'
    )
    expect(matchSituationalIntent('Robo en el negocio')?.intent).toBe(
      'business_incident'
    )
  })

  it('detects health, travel, pet, dental, funeral, and other events', () => {
    expect(matchSituationalIntent('Diagnóstico de cáncer')?.intent).toBe(
      'health_event'
    )
    expect(
      matchSituationalIntent('Perdí el equipaje en el viaje')?.intent
    ).toBe('travel_disruption')
    expect(matchSituationalIntent('Cirugía de mi mascota')?.intent).toBe(
      'pet_incident'
    )
    expect(matchSituationalIntent('Necesito ortodoncia')?.intent).toBe(
      'dental_procedure'
    )
    expect(matchSituationalIntent('Gastos funerarios')?.intent).toBe(
      'funeral_need'
    )
    expect(
      matchSituationalIntent('Reclamación genérica en póliza miscelánea')
        ?.intent
    ).toBe('general_incident')
  })

  it('resolves primary policy type for specialists', () => {
    expect(primaryPolicyTypeForIntent('health_event')).toBe('health')
    expect(primaryPolicyTypeForIntent('emergency_accident')).toBe('auto')
  })
})

describe('assistance prefetch helpers', () => {
  it('includes asistencias synonyms', () => {
    expect(ASSISTANCE_KEYWORDS).toContain('asistencias')
    expect(ASSISTANCE_KEYWORDS).toContain('servicios')
  })

  it('flags intents that need benefits assistances prefetch', () => {
    expect(usesAssistancePrefetch('home_assistance')).toBe(true)
    expect(usesAssistancePrefetch('health_event')).toBe(false)
  })
})
