import { z } from 'zod'

const serverEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  APP_URL: z.string().url().optional(),
  /** Google Generative Language API — text-embedding-004 for MarIAna RAG */
  EMBEDDING_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    APP_URL: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  })
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
