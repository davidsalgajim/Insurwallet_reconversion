const INSURANCE_KEYWORDS = [
  'póliza',
  'poliza',
  'seguro',
  'cobertura',
  'prima',
  'siniestro',
  'beneficiario',
  'deducible',
  'aseguradora',
  'policy',
  'insurance',
  'coverage',
  'premium',
  'claim',
  'beneficiary',
  'deductible',
] as const

const OFF_TOPIC_PATTERNS = [
  /\b(receta|cocina|clima|fútbol|crypto|bitcoin)\b/i,
  /\b(recipe|weather|football|stock\s+market)\b/i,
] as const

const MAX_MESSAGE_LENGTH = 4_000
const MAX_SESSION_TOKENS = 32_000
const MAX_REQUESTS_PER_MINUTE = 20

type RateLimitEntry = {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function isInsuranceScoped(message: string): boolean {
  const normalized = message.toLowerCase().trim()
  if (!normalized) {
    return false
  }

  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false
  }

  return INSURANCE_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function validateMessageLength(message: string): boolean {
  return message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH
}

export function wrapDocumentData(text: string): string {
  return `<document_data>\n${text}\n</document_data>`
}

export function checkSessionTokenLimit(estimatedTokens: number): boolean {
  return estimatedTokens <= MAX_SESSION_TOKENS
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function checkRateLimit(
  uid: string,
  now = Date.now()
): { allowed: boolean; retryAfterMs?: number } {
  const entry = rateLimitStore.get(uid)
  const windowMs = 60_000

  if (!entry || now - entry.windowStart >= windowMs) {
    rateLimitStore.set(uid, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      retryAfterMs: windowMs - (now - entry.windowStart),
    }
  }

  entry.count += 1
  rateLimitStore.set(uid, entry)
  return { allowed: true }
}

export function resetRateLimits(): void {
  rateLimitStore.clear()
}

export function isInsuranceScopedResponse(text: string): boolean {
  const normalized = text.toLowerCase()
  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false
  }

  return (
    INSURANCE_KEYWORDS.some((keyword) => normalized.includes(keyword)) ||
    normalized.length < 500
  )
}
