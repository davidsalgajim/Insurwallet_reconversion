import type { EvalScenario } from '../types'

const SITUATIONAL_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_contacts',
  'search_document_chunks',
] as const

export const healthScenarios: EvalScenario[] = [
  {
    id: 'health-01',
    policyType: 'health',
    message: 'Me diagnosticaron cáncer de próstata, ¿estoy cubierto?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'health_event',
        policyTypes: ['health', 'life'],
      },
      tools: [...SITUATIONAL_TOOLS],
      shouldAsk: ['diagnosis'],
      shouldMention: ['waiting period', 'exclusion'],
    },
  },
  {
    id: 'health-02',
    policyType: 'health',
    message: 'Necesito hospitalización urgente, ¿qué cubre mi EPS/seguro?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'health_event',
        policyTypes: ['health', 'life'],
      },
    },
  },
  {
    id: 'health-03',
    policyType: 'health',
    message: '¿Cubre mi póliza de salud quimioterapia?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'health_event',
        policyTypes: ['health', 'life'],
      },
    },
  },
  {
    id: 'health-04',
    policyType: 'health',
    message: '¿Qué deducible tengo en salud?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'health-05',
    policyType: 'health',
    message: '¿Cuándo vence mi seguro de salud?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'health-06',
    policyType: 'health',
    message: '¿Qué dice el clausulado sobre preexistencias?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'health-07',
    policyType: 'health',
    message: 'Tengo cirugía programada, ¿está cubierta?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'health_event',
        policyTypes: ['health', 'life'],
      },
    },
  },
  {
    id: 'health-08',
    policyType: 'health',
    message: '¿A quién llamo del agente de salud?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'health-09',
    policyType: 'health',
    message: 'Medical emergency — am I covered for specialists?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'health_event',
        policyTypes: ['health', 'life'],
      },
    },
  },
  {
    id: 'health-10',
    policyType: 'health',
    message: '¿Cuánto pago de prima mensual en salud?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'health-11',
    policyType: 'health',
    message: '¿Qué medicamentos cubre mi plan de salud?',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['benefitEntries'],
    },
  },
  {
    id: 'health-12',
    policyType: 'health',
    message: 'Diagnóstico de tumor, ¿qué exclusiones aplican?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'health_event',
        policyTypes: ['health', 'life'],
      },
    },
  },
]
