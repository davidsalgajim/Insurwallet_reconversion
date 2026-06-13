import type { EvalScenario } from '../types'

const EMERGENCY_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'get_contacts',
] as const

export const autoScenarios: EvalScenario[] = [
  {
    id: 'auto-01',
    policyType: 'auto',
    message: 'Tuve un accidente de tránsito en Bogotá',
    expectedBehavior: {
      route: {
        agent: 'emergency',
        situationalIntent: 'emergency_accident',
        policyTypes: ['auto'],
        minConfidence: 0.9,
      },
      tools: [...EMERGENCY_TOOLS],
      shouldAsk: ['city', 'location'],
      shouldMention: ['deductible', 'roadside'],
    },
  },
  {
    id: 'auto-02',
    policyType: 'auto',
    message: 'Me chocaron y necesito reportar el siniestro',
    expectedBehavior: {
      route: {
        agent: 'emergency',
        situationalIntent: 'emergency_accident',
        policyTypes: ['auto'],
      },
    },
  },
  {
    id: 'auto-03',
    policyType: 'auto',
    message: 'Robo del auto anoche, ¿qué hago?',
    expectedBehavior: {
      route: {
        agent: 'emergency',
        situationalIntent: 'emergency_accident',
        policyTypes: ['auto'],
      },
    },
  },
  {
    id: 'auto-04',
    policyType: 'auto',
    message: 'Car accident on the highway — what should I do first?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'emergency',
        situationalIntent: 'emergency_accident',
        policyTypes: ['auto'],
      },
    },
  },
  {
    id: 'auto-05',
    policyType: 'auto',
    message: '¿Cuándo vence mi seguro de auto?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'auto-06',
    policyType: 'auto',
    message: '¿Estoy cubierto por robo total?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'auto-07',
    policyType: 'auto',
    message: '¿Qué dice el clausulado sobre exclusiones de auto?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'auto-08',
    policyType: 'auto',
    message: 'Necesito grúa, ¿tengo asistencia vial?',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['asistencias', 'benefitEntries'],
    },
  },
  {
    id: 'auto-09',
    policyType: 'auto',
    message: 'Collision on highway — deductible amount?',
    locale: 'en',
    expectedBehavior: {
      route: { agent: 'emergency' },
    },
  },
  {
    id: 'auto-10',
    policyType: 'auto',
    message: '¿Cuánto pago de prima del auto?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'auto-11',
    policyType: 'auto',
    message: '¿Teléfono del agente del seguro de auto?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'auto-12',
    policyType: 'auto',
    message: 'Estrellé el carro, ¿qué documentos pide la aseguradora?',
    expectedBehavior: {
      route: {
        agent: 'emergency',
        situationalIntent: 'emergency_accident',
        policyTypes: ['auto'],
      },
      shouldMention: ['police report'],
    },
  },
]
