import type { EvalScenario } from '../types'

const SITUATIONAL_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_contacts',
] as const

export const lifeScenarios: EvalScenario[] = [
  {
    id: 'life-01',
    policyType: 'life',
    message: 'Mi padre falleció, ¿cómo reclamo el seguro de vida?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
      tools: [...SITUATIONAL_TOOLS, 'search_document_chunks'],
      shouldMention: ['beneficiar', 'death benefit'],
    },
  },
  {
    id: 'life-02',
    policyType: 'life',
    message: '¿Qué beneficiarios tengo en mi póliza de vida?',
    expectedBehavior: {
      route: { agent: 'tier0', situationalIntent: undefined },
    },
  },
  {
    id: 'life-03',
    policyType: 'life',
    message: 'Quedé en invalidez permanente, ¿mi seguro de vida cubre?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
      shouldMention: ['disability', 'waiting period'],
    },
  },
  {
    id: 'life-04',
    policyType: 'life',
    message: '¿Cuánto paga el beneficio por muerte accidental?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
      shouldMention: ['accidental death'],
    },
  },
  {
    id: 'life-05',
    policyType: 'life',
    message: 'Necesito iniciar un life insurance claim por fallecimiento',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
      tools: [...SITUATIONAL_TOOLS],
    },
  },
  {
    id: 'life-06',
    policyType: 'life',
    message: '¿Hay periodo de carencia por invalidez en mi seguro de vida?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
      shouldMention: ['waiting period'],
    },
  },
  {
    id: 'life-07',
    policyType: 'life',
    message: '¿A quién llamo de la aseguradora de vida?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'life-08',
    policyType: 'life',
    message: '¿Qué exclusiones tiene mi póliza de vida?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'life-09',
    policyType: 'life',
    message: 'Reportaron incapacidad total, ¿aplica mi cobertura de vida?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
    },
  },
  {
    id: 'life-10',
    policyType: 'life',
    message: '¿Cuándo vence mi seguro de vida?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'life-11',
    policyType: 'life',
    message: '¿Cuánto pago de prima en la póliza de vida?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'life-12',
    policyType: 'life',
    message: '¿Qué cubre mi seguro de vida en caso de muerte?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'life_event',
        policyTypes: ['life'],
      },
      shouldMention: ['beneficiar', 'death benefit'],
    },
  },
]
