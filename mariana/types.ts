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
] as const

export type Tier0Intent = (typeof TIER0_INTENTS)[number]

export type PolicyMetadata = {
  id: string
  policyNumber: string
  insurerName: string
  policyType: string
  endDate: string
}

export type RouteDecision = {
  agent: MarianaAgentId
  tier0Intent?: Tier0Intent
  confidence: number
  entities: {
    policyHint?: string
    topic?: string
  }
}

export type MarianaChatChunk = {
  type: 'delta' | 'done' | 'error'
  content?: string
  agent?: MarianaAgentId
  tier0Intent?: Tier0Intent
}
