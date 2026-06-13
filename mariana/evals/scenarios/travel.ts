import type { EvalScenario } from '../types'

const TRAVEL_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'get_contacts',
  'search_document_chunks',
] as const

export const travelScenarios: EvalScenario[] = [
  {
    id: 'travel-01',
    policyType: 'travel',
    message: 'Cancelé el viaje por enfermedad, ¿me cubre el seguro de viaje?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'travel_disruption',
        policyTypes: ['travel'],
      },
      tools: [...TRAVEL_TOOLS],
      shouldAsk: ['destination', 'travel dates'],
    },
  },
  {
    id: 'travel-02',
    policyType: 'travel',
    message: 'Perdí el equipaje en el aeropuerto',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'travel_disruption',
        policyTypes: ['travel'],
      },
    },
  },
  {
    id: 'travel-03',
    policyType: 'travel',
    message: 'Me enfermé en el extranjero, ¿tengo cobertura médica?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'travel_disruption',
        policyTypes: ['travel'],
      },
      shouldMention: ['medical abroad', 'repatriation'],
    },
  },
  {
    id: 'travel-04',
    policyType: 'travel',
    message: 'Trip cancellation — what does my travel insurance cover?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'travel_disruption',
        policyTypes: ['travel'],
      },
    },
  },
  {
    id: 'travel-05',
    policyType: 'travel',
    message: '¿Estoy cubierto para un viaje a Europa?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'travel-06',
    policyType: 'travel',
    message: '¿Cuándo vence mi seguro de viaje?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'travel-07',
    policyType: 'travel',
    message: 'Baggage loss limit on travel policy?',
    locale: 'en',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'travel-08',
    policyType: 'travel',
    message: '¿Qué dice el clausulado sobre exclusiones del viaje?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'travel-09',
    policyType: 'travel',
    message: 'Necesito repatriación médica desde México',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'travel_disruption',
        policyTypes: ['travel'],
      },
    },
  },
  {
    id: 'travel-10',
    policyType: 'travel',
    message: '¿Cuánto pago de prima del seguro de viaje?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'travel-11',
    policyType: 'travel',
    message: '¿Teléfono de asistencia en viaje?',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['asistencias'],
    },
  },
  {
    id: 'travel-12',
    policyType: 'travel',
    message: 'Perdí la maleta en conexión, ¿qué documentos necesito?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'travel_disruption',
        policyTypes: ['travel'],
      },
    },
  },
]
