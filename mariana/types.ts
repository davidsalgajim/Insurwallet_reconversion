export const MARIANA_AGENT_IDS = [
  'tier0',
  'documental',
  'coverage',
  'expiry',
  'insurers',
  'emergency',
] as const

export type MarianaAgentId = (typeof MARIANA_AGENT_IDS)[number]

export const TIER0_INTENTS = [
  'policy_expiry',
  'premium_info',
  'contact_info',
  'beneficiary_info',
] as const

export type Tier0Intent = (typeof TIER0_INTENTS)[number]

export const SITUATIONAL_INTENTS = [
  'life_event',
  'health_event',
  'emergency_accident',
  'home_assistance',
  'travel_disruption',
  'pet_incident',
  'funeral_need',
  'dental_procedure',
  'business_incident',
  'general_incident',
] as const

export type SituationalIntent = (typeof SITUATIONAL_INTENTS)[number]

export type PolicyMetadata = {
  id: string
  policyNumber: string
  insurerName: string
  policyType: string
  holderName: string
  startDate: string
  endDate: string
  premium: number
  currency: string
  paymentFrequency: string
  coverageCount: number
  deductibleCount: number
  beneficiaryCount: number
  benefitCount: number
}

export type RouteDecision = {
  agent: MarianaAgentId
  tier0Intent?: Tier0Intent
  confidence: number
  entities: {
    policyHint?: string
    topic?: string
    situationalIntent?: SituationalIntent
    policyTypes?: string[]
  }
}

export type MarianaCitation = {
  policyId: string
  documentId: string
  page?: number
  label: string
}

export type MarianaChatChunk = {
  type: 'delta' | 'done' | 'error' | 'citation'
  content?: string
  agent?: MarianaAgentId
  tier0Intent?: Tier0Intent
  citations?: MarianaCitation[]
  citation?: MarianaCitation
}
