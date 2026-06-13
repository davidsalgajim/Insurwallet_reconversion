import type { PolicyType } from '@/lib/schemas/policy'
import type { MarianaAgentId, SituationalIntent } from '@/mariana/types'

export type SituationalMatch = {
  intent: SituationalIntent
  policyTypes: PolicyType[]
  agent: MarianaAgentId
}

export const SITUATIONAL_POLICY_TYPES: Record<
  SituationalIntent,
  readonly PolicyType[]
> = {
  life_event: ['life'],
  health_event: ['health', 'life'],
  emergency_accident: ['auto'],
  home_assistance: ['home'],
  travel_disruption: ['travel'],
  pet_incident: ['pet'],
  funeral_need: ['funeral'],
  dental_procedure: ['dental'],
  business_incident: ['business'],
  general_incident: ['other'],
}

/** Intents where benefitEntries / asistencias prefetch is relevant */
export const ASSISTANCE_SITUATIONAL_INTENTS: ReadonlySet<SituationalIntent> =
  new Set([
    'emergency_accident',
    'home_assistance',
    'travel_disruption',
    'pet_incident',
    'business_incident',
    'general_incident',
  ])

export const ASSISTANCE_KEYWORDS = [
  'asistencia',
  'asistencias',
  'servicio',
  'servicios',
  'plomer',
  'tuber',
  'fuga',
  'grúa',
  'grua',
  'remolque',
  'tow',
  'roadside',
  'cerrajer',
  'locksmith',
  'electricist',
  'vidrier',
  'techo',
  'techado',
  'domicilio',
  'hogar',
  'home',
  'emergencia',
  'assistance',
  'pipe',
  'leak',
  'plumb',
  'veterinario',
  'vet',
  'funeraria',
  'repatriacion',
  'repatriation',
] as const

const SITUATIONAL_DEFINITIONS: ReadonlyArray<{
  intent: SituationalIntent
  agent: MarianaAgentId
  patterns: RegExp[]
}> = [
  {
    intent: 'emergency_accident',
    agent: 'emergency',
    patterns: [
      /\b(estrell\w*|choqu\w*|atropell\w*|accidente\s+de\s+tr[aá]nsito|car\s+accident|collision|crash)\b/i,
      /\b(robo\s+del\s+auto|robo\s+de\s+veh[ií]culo|car\s+theft|vehicle\s+theft)\b/i,
    ],
  },
  {
    intent: 'home_assistance',
    agent: 'coverage',
    patterns: [
      /\b(tuber[ií]a|fuga|inundaci[oó]n|plomer[ií]a|pipe|leak|flooding|da[nñ]o\s+en\s+casa|home\s+damage)\b/i,
      /\b(asistencia\s+(en\s+)?(casa|hogar|domicilio)|home\s+assistance|asistencias?\s+de\s+(plomer[ií]a|cerrajer[ií]a))\b/i,
    ],
  },
  {
    intent: 'pet_incident',
    agent: 'coverage',
    patterns: [
      /\b(mascota|perro|gato|pet\s+insurance|seguro\s+de\s+mascota)\b/i,
      /\b(veterinari|cirug[ií]a\s+(de\s+)?(mascota|perro|gato)|vet\s+bill)\b/i,
    ],
  },
  {
    intent: 'dental_procedure',
    agent: 'coverage',
    patterns: [
      /\b(ortodoncia|implante\s+dental|limpieza\s+dental|endodoncia|seguro\s+dental)\b/i,
      /\b(dental\s+insurance|carillas|extracci[oó]n\s+dental)\b/i,
    ],
  },
  {
    intent: 'funeral_need',
    agent: 'coverage',
    patterns: [
      /\b(funerari|gastos\s+funerarios|servicio\s+funerario|funeral\s+expense|previsi[oó]n\s+exequial|seguro\s+funerario)\b/i,
      /\b(exequias|velatorio|cremaci[oó]n|repatriaci[oó]n\s+funeraria)\b/i,
    ],
  },
  {
    intent: 'travel_disruption',
    agent: 'coverage',
    patterns: [
      /\b(cancel[eé]\s+(el\s+)?viaje|cancelaci[oó]n\s+de\s+viaje|perd[ií]\s+(el\s+|la\s+)?(equipaje|maleta)|baggage|trip\s+cancellation)\b/i,
      /\b(enferm[eé]\s+(en\s+el\s+)?extranjero|medical\s+abroad|repatriaci[oó]n\s+m[eé]dica)\b/i,
    ],
  },
  {
    intent: 'business_incident',
    agent: 'coverage',
    patterns: [
      /\b(incendio\s+(en\s+)?(el\s+|mi\s+)?(local|negocio|empresa|bodega)|robo\s+(en\s+)?(el\s+|mi\s+)?(local|negocio|empresa|bodega))\b/i,
      /\b(interrupci[oó]n\s+de\s+negocio|business\s+interruption|seguro\s+empresarial)\b/i,
      /\b(inventario\s+(da[nñ]ado|mojado)|da[nñ]o\s+a\s+inventario|responsabilidad\s+civil\s+empresarial|commercial\s+liability)\b/i,
      /\b(empleado\s+lesionado|accidente\s+laboral|accidente\s+en\s+planta)\b/i,
    ],
  },
  {
    intent: 'life_event',
    agent: 'coverage',
    patterns: [
      /\b(falleci|muerte|beneficio\s+por\s+muerte|death\s+benefit|invalidez|disability|incapacidad)\b/i,
      /\b(pago\s+a\s+beneficiari|life\s+insurance\s+claim)\b/i,
    ],
  },
  {
    intent: 'health_event',
    agent: 'coverage',
    patterns: [
      /\b(c[aá]ncer|enfermedad|diagn[oó]stico|hospitalizaci[oó]n|cirug[ií]a|pr[oó]stata|prostate|quimioterapia|quimio|chemo|tumor|urgencias?\s+m[eé]dicas?)\b/i,
      /\b(hospital\b|specialist|especialista\s+m[eé]dico|medical\s+emergency)\b/i,
    ],
  },
  {
    intent: 'general_incident',
    agent: 'coverage',
    patterns: [
      /\b(reclamaci[oó]n\s+gen[eé]rica|siniestro\s+no\s+identificado|other\s+policy\s+claim)\b/i,
      /\b(p[oó]liza\s+miscel[aá]nea|seguro\s+especial|custom\s+coverage)\b/i,
    ],
  },
]

export function matchSituationalIntent(
  message: string
): SituationalMatch | null {
  for (const { intent, agent, patterns } of SITUATIONAL_DEFINITIONS) {
    if (patterns.some((pattern) => pattern.test(message))) {
      return {
        intent,
        agent,
        policyTypes: [...SITUATIONAL_POLICY_TYPES[intent]],
      }
    }
  }
  return null
}

export function primaryPolicyTypeForIntent(
  intent: SituationalIntent
): PolicyType {
  return SITUATIONAL_POLICY_TYPES[intent][0]!
}

export function usesAssistancePrefetch(intent: SituationalIntent): boolean {
  return ASSISTANCE_SITUATIONAL_INTENTS.has(intent)
}
