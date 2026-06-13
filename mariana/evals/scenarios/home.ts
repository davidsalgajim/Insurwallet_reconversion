import type { EvalScenario } from '../types'

const HOME_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'get_contacts',
  'search_document_chunks',
] as const

export const homeScenarios: EvalScenario[] = [
  {
    id: 'home-01',
    policyType: 'home',
    message: 'Se reventó una tubería y hay fuga en la casa',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'home_assistance',
        policyTypes: ['home'],
      },
      tools: [...HOME_TOOLS],
      shouldMention: ['asistencias', 'plumb'],
    },
  },
  {
    id: 'home-02',
    policyType: 'home',
    message: 'Necesito asistencia de plomería a domicilio',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'home_assistance',
        policyTypes: ['home'],
      },
    },
  },
  {
    id: 'home-03',
    policyType: 'home',
    message: 'Inundación en el apartamento, ¿estoy cubierto?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'home_assistance',
        policyTypes: ['home'],
      },
    },
  },
  {
    id: 'home-04',
    policyType: 'home',
    message: 'Home damage from pipe leak — coverage?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'home_assistance',
        policyTypes: ['home'],
      },
    },
  },
  {
    id: 'home-05',
    policyType: 'home',
    message: '¿Cuántas asistencias de cerrajería tengo al año?',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['annual event limits', 'asistencias'],
    },
  },
  {
    id: 'home-06',
    policyType: 'home',
    message: '¿Qué cubre mi seguro de hogar por robo?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'home-07',
    policyType: 'home',
    message: '¿Cuándo vence mi póliza de hogar?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'home-08',
    policyType: 'home',
    message: '¿Exclusiones por daño de agua en el clausulado?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'home-09',
    policyType: 'home',
    message: 'Daño en casa por filtración del techo',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'home_assistance',
        policyTypes: ['home'],
      },
    },
  },
  {
    id: 'home-10',
    policyType: 'home',
    message: '¿Prima anual del seguro de hogar?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'home-11',
    policyType: 'home',
    message: '¿Contacto del agente de hogar?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'home-12',
    policyType: 'home',
    message: 'Home assistance for electrical failure at home',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'home_assistance',
        policyTypes: ['home'],
      },
    },
  },
]
