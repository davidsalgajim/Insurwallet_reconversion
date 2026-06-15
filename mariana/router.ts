import {
  matchSituationalIntent,
  usesAssistancePrefetch,
} from '@/mariana/situational'
import type {
  MarianaAgentId,
  PolicyMetadata,
  RouteDecision,
  SituationalIntent,
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
  'estrell',
  'choque',
  'collision',
  'crash',
] as const

const TIER0_PATTERNS: ReadonlyArray<{
  intent: Tier0Intent
  patterns: RegExp[]
}> = [
  {
    intent: 'policy_expiry',
    patterns: [
      /\b(cu[aá]ndo\s+vence|fecha\s+de\s+vencimiento|vencimiento|vencid[oa]s?|renovaci[oó]n|expire|expir)/i,
      /\b(when\s+does\s+.*\s+expire|renewal\s+date|expired\s+polic)/i,
      /\b(qu[eé]\s+pol[ií]zas?\s+vencid)/i,
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
      /\b(cubre|cobertura|cubierto|beneficios?|deducible|am\s+i\s+covered|coverage)\b/i,
      /\b(asistencias?|gr[uú]a|roadside|repatriaci[oó]n)\b/i,
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

export { matchSituationalIntent } from '@/mariana/situational'

function extractPolicyHint(
  message: string,
  policies: PolicyMetadata[],
  policyTypes?: string[]
): string | undefined {
  const normalized = message.toLowerCase()
  const scoped = policyTypes?.length
    ? policies.filter((policy) =>
        policyTypes.includes(policy.policyType.toLowerCase())
      )
    : policies

  const match = scoped.find((policy) => {
    const type = policy.policyType.toLowerCase()
    const insurer = policy.insurerName.toLowerCase()
    return normalized.includes(type) || normalized.includes(insurer)
  })

  return match?.id ?? scoped[0]?.id
}

function buildSituationalRoute(
  situationalIntent: SituationalIntent,
  policyTypes: string[],
  message: string,
  policies: PolicyMetadata[],
  agent: MarianaAgentId
): RouteDecision {
  return {
    agent,
    confidence: agent === 'emergency' ? 0.95 : 0.92,
    entities: {
      situationalIntent,
      policyTypes,
      policyHint: extractPolicyHint(message, policies, policyTypes),
      topic: agent === 'emergency' ? 'emergency' : 'coverage',
    },
  }
}

function matchAgent(message: string): MarianaAgentId | null {
  for (const { agent, patterns } of AGENT_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(message))) {
      return agent
    }
  }
  return null
}

export function routeMessage(
  message: string,
  policies: PolicyMetadata[] = []
): RouteDecision {
  const tier0Intent = matchTier0Intent(message)
  if (tier0Intent) {
    return {
      agent: 'tier0',
      tier0Intent,
      confidence: 0.9,
      entities: { policyHint: extractPolicyHint(message, policies) },
    }
  }

  if (/\b(clausulado|fine\s+print|condiciones\s+generales)\b/i.test(message)) {
    return {
      agent: 'documental',
      confidence: 0.8,
      entities: {
        policyHint: extractPolicyHint(message, policies),
        topic: 'documental',
      },
    }
  }

  const situational = matchSituationalIntent(message)

  if (situational?.intent === 'emergency_accident') {
    return buildSituationalRoute(
      situational.intent,
      situational.policyTypes,
      message,
      policies,
      'emergency'
    )
  }

  if (situational && situational.agent === 'coverage') {
    return buildSituationalRoute(
      situational.intent,
      situational.policyTypes,
      message,
      policies,
      'coverage'
    )
  }

  const documentalMatch = matchAgent(message)
  if (documentalMatch === 'documental') {
    return {
      agent: 'documental',
      confidence: 0.75,
      entities: {
        policyHint: extractPolicyHint(message, policies),
        topic: 'documental',
      },
    }
  }

  const agentMatch = matchAgent(message)
  if (agentMatch) {
    return {
      agent: agentMatch,
      confidence: 0.75,
      entities: {
        policyHint: extractPolicyHint(message, policies),
        topic: agentMatch,
      },
    }
  }

  if (matchEmergencyKeywords(message)) {
    return buildSituationalRoute(
      'emergency_accident',
      ['auto'],
      message,
      policies,
      'emergency'
    )
  }

  return {
    agent: 'documental',
    confidence: 0.5,
    entities: { policyHint: extractPolicyHint(message, policies) },
  }
}

export function matchTier0Intent(message: string): Tier0Intent | null {
  for (const { intent, patterns } of TIER0_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(message))) {
      return intent
    }
  }
  return null
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

export { usesAssistancePrefetch }
