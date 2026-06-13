import type { EvalScenario } from '../types'

const DENTAL_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_contacts',
  'search_document_chunks',
] as const

export const dentalScenarios: EvalScenario[] = [
  {
    id: 'dental-01',
    policyType: 'dental',
    message: '¿Mi seguro dental cubre ortodoncia para mi hijo?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
      tools: [...DENTAL_TOOLS],
      shouldMention: ['orthodontics', 'waiting period'],
    },
  },
  {
    id: 'dental-02',
    policyType: 'dental',
    message: 'Necesito un implante dental, ¿está cubierto?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
    },
  },
  {
    id: 'dental-03',
    policyType: 'dental',
    message: '¿Cuánto cubre la limpieza dental anual?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
    },
  },
  {
    id: 'dental-04',
    policyType: 'dental',
    message: 'Dental insurance — preventive care coverage?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
    },
  },
  {
    id: 'dental-05',
    policyType: 'dental',
    message: 'Extracción dental de muela del juicio, ¿cubre?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
    },
  },
  {
    id: 'dental-06',
    policyType: 'dental',
    message: '¿Cuándo vence mi póliza dental?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'dental-07',
    policyType: 'dental',
    message: '¿Exclusiones cosméticas en el clausulado dental?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'dental-08',
    policyType: 'dental',
    message: 'Endodoncia urgente, ¿qué copago tengo?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
    },
  },
  {
    id: 'dental-09',
    policyType: 'dental',
    message: '¿Cuánto pago de prima del seguro dental?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'dental-10',
    policyType: 'dental',
    message: '¿Contacto del agente dental?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'dental-11',
    policyType: 'dental',
    message: 'Carillas estéticas, ¿las cubre mi plan?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
      shouldMention: ['cosmetic'],
    },
  },
  {
    id: 'dental-12',
    policyType: 'dental',
    message: '¿Máximo anual del seguro dental?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'dental_procedure',
        policyTypes: ['dental'],
      },
      shouldMention: ['annual maximums'],
    },
  },
]
