import type { EvalScenario } from '../types'

const OTHER_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'get_contacts',
  'search_document_chunks',
] as const

export const otherScenarios: EvalScenario[] = [
  {
    id: 'other-01',
    policyType: 'other',
    message: 'Tengo un siniestro en mi póliza miscelánea, ¿qué cubre?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'general_incident',
        policyTypes: ['other'],
      },
      tools: [...OTHER_TOOLS],
      shouldAsk: ['describe'],
    },
  },
  {
    id: 'other-02',
    policyType: 'other',
    message: 'Reclamación genérica en seguro especial',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'general_incident',
        policyTypes: ['other'],
      },
    },
  },
  {
    id: 'other-03',
    policyType: 'other',
    message: 'Custom coverage policy — what is covered?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'general_incident',
        policyTypes: ['other'],
      },
    },
  },
  {
    id: 'other-04',
    policyType: 'other',
    message: '¿Qué beneficios tiene mi póliza other?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'other-05',
    policyType: 'other',
    message: '¿Cuándo vence mi póliza especial?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'other-06',
    policyType: 'other',
    message: '¿Exclusiones en el clausulado de la póliza miscelánea?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'other-07',
    policyType: 'other',
    message: '¿Cuánto pago de prima?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'other-08',
    policyType: 'other',
    message: '¿Contacto del agente de la póliza?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'other-09',
    policyType: 'other',
    message: '¿Deducible registrado en mi seguro custom?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'other-10',
    policyType: 'other',
    message: 'Necesito asistencia incluida en benefitEntries de póliza other',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['asistencias'],
    },
  },
  {
    id: 'other-11',
    policyType: 'other',
    message: 'Siniestro no identificado en póliza especial',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'general_incident',
        policyTypes: ['other'],
      },
    },
  },
  {
    id: 'other-12',
    policyType: 'other',
    message: '¿Qué cubre mi seguro esporádico para evento único?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
]
