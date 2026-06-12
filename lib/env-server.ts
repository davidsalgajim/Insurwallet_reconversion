import { z } from 'zod'

/**
 * Server-only environment variables (never NEXT_PUBLIC_*).
 * Validated lazily when server code reads them.
 */
const serverEnvSchema = z.object({
  WORKER_URL: z.string().url().optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  INTERNAL_API_SECRET: z.string().min(16).optional(),
  APP_URL: z.string().url().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cachedServerEnv: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv
  }

  const parsed = serverEnvSchema.safeParse({
    WORKER_URL: process.env.WORKER_URL?.trim() || undefined,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY?.trim() || undefined,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET?.trim() || undefined,
    APP_URL: process.env.APP_URL?.trim() || undefined,
    FIREBASE_STORAGE_BUCKET:
      process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
      undefined,
  })

  cachedServerEnv = parsed.success
    ? parsed.data
    : {
        WORKER_URL: process.env.WORKER_URL?.trim() || undefined,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY?.trim() || undefined,
        INTERNAL_API_SECRET:
          process.env.INTERNAL_API_SECRET?.trim() || undefined,
        APP_URL: process.env.APP_URL?.trim() || undefined,
        FIREBASE_STORAGE_BUCKET:
          process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
          undefined,
      }

  return cachedServerEnv
}

/** Reset cache — for tests only. */
export function resetServerEnvCache(): void {
  cachedServerEnv = null
}
