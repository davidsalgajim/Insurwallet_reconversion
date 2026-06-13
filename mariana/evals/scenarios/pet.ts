import type { EvalScenario } from '../types'

const PET_TOOLS = [
  'get_policies_summary',
  'get_policies_by_type',
  'get_coverage_for_event',
  'get_benefits_assistances',
  'get_contacts',
  'search_document_chunks',
] as const

export const petScenarios: EvalScenario[] = [
  {
    id: 'pet-01',
    policyType: 'pet',
    message: 'Mi perro necesita cirugía urgente, ¿el seguro de mascota cubre?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'pet_incident',
        policyTypes: ['pet'],
      },
      tools: [...PET_TOOLS],
      shouldAsk: ['species'],
    },
  },
  {
    id: 'pet-02',
    policyType: 'pet',
    message: 'Factura veterinaria alta por enfermedad del gato',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'pet_incident',
        policyTypes: ['pet'],
      },
    },
  },
  {
    id: 'pet-03',
    policyType: 'pet',
    message: '¿Qué cubre mi seguro de mascota?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'pet_incident',
        policyTypes: ['pet'],
      },
    },
  },
  {
    id: 'pet-04',
    policyType: 'pet',
    message: 'Pet insurance — vet bill reimbursement?',
    locale: 'en',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'pet_incident',
        policyTypes: ['pet'],
      },
    },
  },
  {
    id: 'pet-05',
    policyType: 'pet',
    message: '¿Hay periodo de carencia en el seguro del perro?',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['waiting period'],
    },
  },
  {
    id: 'pet-06',
    policyType: 'pet',
    message: '¿Cuándo vence la póliza de mascota?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'pet-07',
    policyType: 'pet',
    message: '¿Qué dice el clausulado sobre exclusiones por raza?',
    expectedBehavior: {
      route: { agent: 'documental' },
    },
  },
  {
    id: 'pet-08',
    policyType: 'pet',
    message: 'Accidente de mi mascota en el parque',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'pet_incident',
        policyTypes: ['pet'],
      },
    },
  },
  {
    id: 'pet-09',
    policyType: 'pet',
    message: '¿Cuánto pago de prima del seguro de mascota?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'pet-10',
    policyType: 'pet',
    message: '¿Contacto de la aseguradora de mascotas?',
    expectedBehavior: {
      route: { agent: 'tier0' },
    },
  },
  {
    id: 'pet-11',
    policyType: 'pet',
    message: 'Medicamentos mensuales para mi gato, ¿cubre?',
    expectedBehavior: {
      route: {
        agent: 'coverage',
        situationalIntent: 'pet_incident',
        policyTypes: ['pet'],
      },
    },
  },
  {
    id: 'pet-12',
    policyType: 'pet',
    message: 'Responsabilidad civil por daño de mi perro a un tercero',
    expectedBehavior: {
      route: { agent: 'coverage' },
      shouldMention: ['liability'],
    },
  },
]
