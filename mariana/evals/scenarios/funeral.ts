import type { EvalScenario } from '../types'

const FUNERAL_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_contacts',
  'search_document_chunks',
] as const

export const funeralScenarios: EvalScenario[] = [
  {
    id: 'funeral-01',
    policyType: 'funeral',
    message: 'Necesito activar el servicio funerario de mi póliza exequial',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
      tools: [...FUNERAL_TOOLS],
      shouldMention: ['funeral expense', 'empathy'],
    },
  },
  {
    id: 'funeral-02',
    policyType: 'funeral',
    message: '¿Qué gastos funerarios cubre mi previsión exequial?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
    },
  },
  {
    id: 'funeral-03',
    policyType: 'funeral',
    message: '¿Incluye repatriación el seguro funerario?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
    },
  },
  {
    id: 'funeral-04',
    policyType: 'funeral',
    message: 'Funeral expense cap on my policy?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
    },
  },
  {
    id: 'funeral-05',
    policyType: 'funeral',
    message: '¿Cuándo vence mi póliza funeraria?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'funeral-06',
    policyType: 'funeral',
    message: '¿Qué dice el clausulado del plan exequial?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'funeral-07',
    policyType: 'funeral',
    message: 'Velatorio y cremación, ¿están incluidos?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
    },
  },
  {
    id: 'funeral-08',
    policyType: 'funeral',
    message: '¿Cuánto pago de prima del seguro funerario?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'funeral-09',
    policyType: 'funeral',
    message: '¿A quién llamo de la funeraria asociada?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'funeral-10',
    policyType: 'funeral',
    message: 'Beneficiarios del plan exequial',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'funeral-11',
    policyType: 'funeral',
    message: '¿Qué documentos piden para el servicio funerario?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
      shouldMention: ['death certificate'],
    },
  },
  {
    id: 'funeral-12',
    policyType: 'funeral',
    message: 'Exequias en otra ciudad, ¿cubre traslado?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'funeral_need',
        policyTypes: ['funeral'],
      },
    },
  },
]
