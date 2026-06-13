import type {
  MarianaAgentId,
  PolicyMetadata,
  RouteDecision,
  Tier0Intent,
} from '@/mariana/types'

const EMERGENCY_KEYWORDS = [
  'accidente',
  'robo',
  'siniestro',
  'emergencia',
  'accident',
  'theft',
  'claim',
  'emergency',
] as const

const TIER0_PATTERNS: ReadonlyArray<{
  intent: Tier0Intent
  patterns: RegExp[]
}> = [
  {
    intent: 'policy_expiry',
    patterns: [
      /\b(cu[aá]ndo\s+vence|fecha\s+de\s+vencimiento|vencimiento|renovaci[oó]n|expire|expir)/i,
      /\b(when\s+does\s+.*\s+expire|renewal\s+date)\b/i,
    ],
  },
  {
    intent: 'premium_info',
    patterns: [
      /\b(prima|primas|cu[aá]nto\s+pago|costo\s+del\s+seguro|premium|payment)\b/i,
    ],
  },
  {
    intent: 'contact_info',
    patterns: [
      /\b(a\s+qui[eé]n\s+llamo|contacto|tel[eé]fono\s+del\s+agente|call|contact)\b/i,
    ],
  },
  {
    intent: 'beneficiary_info',
    patterns: [
      /\b(beneficiari[oa]s?|hereder[oa]s?|beneficiary|beneficiaries)\b/i,
    ],
  },
]

const AGENT_PATTERNS: ReadonlyArray<{
  agent: MarianaAgentId
  patterns: RegExp[]
}> = [
  {
    agent: 'documental',
    patterns: [
      /\b(clausulado|exclusiones|letra\s+peque[nñ]a|condiciones\s+generales|fine\s+print)\b/i,
    ],
  },
  {
    agent: 'coverage',
    patterns: [
      /\b(cubre|cobertura|cubierto|beneficio|deducible|am\s+i\s+covered|coverage)\b/i,
    ],
  },
  {
    agent: 'expiry',
    patterns: [/\b(vence|vencimiento|renovar|renew)\b/i],
  },
  {
    agent: 'insurers',
    patterns: [/\b(aseguradora|agente|asesor|insurer|broker)\b/i],
  },
]

export function matchEmergencyKeywords(message: string): boolean {
  const normalized = message.toLowerCase()
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function matchTier0Intent(message: string): Tier0Intent | null {
  for (const { intent, patterns } of TIER0_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(message))) {
      return intent
    }
  }
  return null
}

function extractPolicyHint(
  message: string,
  policies: PolicyMetadata[]
): string | undefined {
  const normalized = message.toLowerCase()
  const match = policies.find((policy) => {
    const type = policy.policyType.toLowerCase()
    const insurer = policy.insurerName.toLowerCase()
    return normalized.includes(type) || normalized.includes(insurer)
  })
  return match?.id
}

export function routeMessage(
  message: string,
  policies: PolicyMetadata[] = []
): RouteDecision {
  if (matchEmergencyKeywords(message)) {
    return {
      agent: 'emergency',
      confidence: 0.95,
      entities: { policyHint: extractPolicyHint(message, policies) },
    }
  }

  const tier0Intent = matchTier0Intent(message)
  if (tier0Intent) {
    return {
      agent: 'tier0',
      tier0Intent,
      confidence: 0.9,
      entities: { policyHint: extractPolicyHint(message, policies) },
    }
  }

  for (const { agent, patterns } of AGENT_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(message))) {
      return {
        agent,
        confidence: 0.75,
        entities: {
          policyHint: extractPolicyHint(message, policies),
          topic: agent,
        },
      }
    }
  }

  return {
    agent: 'documental',
    confidence: 0.5,
    entities: { policyHint: extractPolicyHint(message, policies) },
  }
}

export function buildTier0Placeholder(
  intent: Tier0Intent,
  locale: string
): string {
  const templates: Record<Tier0Intent, Record<string, string>> = {
    policy_expiry: {
      es: 'Consulta determinística: revisaré las fechas de vencimiento de tus pólizas.',
      en: 'Deterministic lookup: I will check your policy expiry dates.',
      pt: 'Consulta determinística: vou verificar as datas de vencimento das suas apólices.',
    },
    premium_info: {
      es: 'Consulta determinística: revisaré primas y montos registrados.',
      en: 'Deterministic lookup: I will check recorded premiums and amounts.',
      pt: 'Consulta determinística: vou verificar prêmios e valores registrados.',
    },
    contact_info: {
      es: 'Consulta determinística: buscaré contactos de agentes y aseguradoras.',
      en: 'Deterministic lookup: I will find agent and insurer contacts.',
      pt: 'Consulta determinística: vou buscar contatos de agentes e seguradoras.',
    },
    beneficiary_info: {
      es: 'Consulta determinística: revisaré beneficiarios registrados en tus pólizas.',
      en: 'Deterministic lookup: I will check beneficiaries recorded on your policies.',
      pt: 'Consulta determinística: vou verificar beneficiários registrados nas suas apólices.',
    },
  }

  return templates[intent][locale] ?? templates[intent].es
}
