import { z } from 'zod'

const emailSchema = z.string().email()

/**
 * Normalize Resend "from" — empty/invalid → undefined so optional email routes
 * degrade gracefully; MarIAna and other routes never fail on bad Resend config.
 * Accepts plain `user@domain.com` or `Display Name <user@domain.com>`.
 */
export function normalizeResendFromEmail(
  raw: string | undefined
): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) {
    return undefined
  }

  const displayMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
  const emailCandidate = displayMatch?.[2]?.trim() ?? trimmed

  if (!emailSchema.safeParse(emailCandidate).success) {
    return undefined
  }

  return trimmed
}

const serverEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  APP_URL: z.string().url().optional(),
  /** Google Generative Language API — text-embedding-004 for MarIAna RAG */
  EMBEDDING_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function readServerEnvRaw(): ServerEnv {
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY?.trim() || undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim() || undefined,
    RESEND_FROM_EMAIL: normalizeResendFromEmail(process.env.RESEND_FROM_EMAIL),
    APP_URL:
      process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      undefined,
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY?.trim() || undefined,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY?.trim() || undefined,
  }
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(readServerEnvRaw())
  if (parsed.success) {
    return parsed.data
  }

  // Drop invalid optional URLs so email/chat routes are not blocked by APP_URL typos.
  const fallback = serverEnvSchema.safeParse({
    ...readServerEnvRaw(),
    APP_URL: undefined,
  })
  return fallback.success ? fallback.data : readServerEnvRaw()
}

export function hasAnthropicApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

export function hasResendApiKey(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

export function hasEmbeddingApiKey(): boolean {
  return Boolean(
    process.env.EMBEDDING_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim()
  )
}

export function resolveAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  )
}
