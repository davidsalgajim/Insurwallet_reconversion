import type { EvalScenario } from '../types'

const BUSINESS_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'get_contacts',
  'search_document_chunks',
] as const

export const businessScenarios: EvalScenario[] = [
  {
    id: 'business-01',
    policyType: 'business',
    message:
      'Hubo un incendio en mi local comercial, ¿qué cubre el seguro empresarial?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'business_incident',
        policyTypes: ['business'],
      },
      tools: [...BUSINESS_TOOLS],
      shouldMention: ['property', 'documentation'],
    },
  },
  {
    id: 'business-02',
    policyType: 'business',
    message: 'Robo en el negocio anoche',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'business_incident',
        policyTypes: ['business'],
      },
    },
  },
  {
    id: 'business-03',
    policyType: 'business',
    message: 'Interrupción de negocio por cierre temporal, ¿cubre?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'business_incident',
        policyTypes: ['business'],
      },
      shouldMention: ['business interruption'],
    },
  },
  {
    id: 'business-04',
    policyType: 'business',
    message: 'Commercial liability claim — am I covered?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'business_incident',
        policyTypes: ['business'],
      },
    },
  },
  {
    id: 'business-05',
    policyType: 'business',
    message: '¿Qué cubre mi seguro empresarial de responsabilidad civil?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
  {
    id: 'business-06',
    policyType: 'business',
    message: '¿Cuándo vence la póliza de la empresa?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'business-07',
    policyType: 'business',
    message: '¿Exclusiones del clausulado comercial?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'business-08',
    policyType: 'business',
    message: 'Daño a inventario por agua en bodega',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'business_incident',
        policyTypes: ['business'],
      },
    },
  },
  {
    id: 'business-09',
    policyType: 'business',
    message: '¿Cuánto pago de prima del seguro empresarial?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'business-10',
    policyType: 'business',
    message: '¿Teléfono del broker de la póliza comercial?',
    expectedBehavior: {
      route: { agent: 'insurers' },
    },
  },
  {
    id: 'business-11',
    policyType: 'business',
    message: 'Empleado lesionado en planta, ¿cubre la póliza?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'business_incident',
        policyTypes: ['business'],
      },
      shouldMention: ['documentation'],
    },
  },
  {
    id: 'business-12',
    policyType: 'business',
    message: '¿Deducible por siniestro en local?',
    expectedBehavior: {
      route: { agent: 'coverage' },
    },
  },
]
