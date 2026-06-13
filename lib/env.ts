import { z } from 'zod'

import { validateAppCheckEnv } from '@/lib/env-app-check'

export { validateAppCheckEnv } from '@/lib/env-app-check'

const FIREBASE_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_USE_FIREBASE_EMULATORS',
  'NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION',
  'NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY',
  'NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN',
] as const

type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number]

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY: z
    .string()
    .min(1)
    .optional(),
  NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: z.string().min(1).optional(),
})

const DEV_FIREBASE_DEFAULTS: Partial<Record<FirebaseEnvKey, string>> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'demo',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'insurwallet-staging',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'insurwallet-staging.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:demo',
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'false',
  NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION: 'false',
}

/**
 * Read Firebase env with static property access so Next.js inlines NEXT_PUBLIC_*
 * into client bundles. Dynamic `process.env[key]` or Zod parsing `process.env`
 * directly leaves client-side values empty and triggers demo fallbacks.
 */
function readFirebaseEnvFromProcess(): Record<
  FirebaseEnvKey,
  string | undefined
> {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS:
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
    NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION:
      process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION,
    NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY,
    NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN:
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN,
  }
}

function formatZodErrors(error: z.ZodError): string {
  return Object.entries(error.flatten().fieldErrors)
    .map(
      ([field, messages]) => `${field}: ${messages?.join(', ') ?? 'invalid'}`
    )
    .join('; ')
}

function pickDefinedFirebaseEnv(
  source: Record<FirebaseEnvKey, string | undefined>
): Partial<Record<FirebaseEnvKey, string>> {
  const picked: Partial<Record<FirebaseEnvKey, string>> = {}

  for (const key of FIREBASE_ENV_KEYS) {
    const value = source[key]
    if (value !== undefined && value.trim() !== '') {
      picked[key] = value
    }
  }

  return picked
}

const OPTIONAL_FIREBASE_KEYS = new Set<FirebaseEnvKey>([
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_USE_FIREBASE_EMULATORS',
  'NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION',
  'NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY',
  'NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN',
])

const REQUIRED_FIREBASE_KEYS = FIREBASE_ENV_KEYS.filter(
  (key) => !OPTIONAL_FIREBASE_KEYS.has(key)
)

function hasAnyFirebaseEnv(
  source: Record<FirebaseEnvKey, string | undefined>
): boolean {
  return REQUIRED_FIREBASE_KEYS.some((key) => source[key]?.trim())
}

function warnDevEnvFallback(data: z.infer<typeof envSchema>): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const usingDemoKey = data.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo'

  if (usingDemoKey) {
    console.warn(
      '[env] Firebase config incomplete — using demo defaults. Copy .env.example to .env.local and restart the dev server.'
    )
  }

  if (data.NEXT_PUBLIC_USE_FIREBASE_EMULATORS) {
    console.warn(
      '[env] Firebase emulators enabled (NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true).'
    )
  }
}

function throwInvalidEnv(error: z.ZodError, context: string): never {
  throw new Error(
    `[env] Invalid Firebase environment (${context}): ${formatZodErrors(error)}. ` +
      'Fix .env.local and restart the dev server. Demo fallbacks are disabled when any Firebase var is set.'
  )
}

function parseEnv(): z.infer<typeof envSchema> {
  const rawEnv = readFirebaseEnvFromProcess()
  const result = envSchema.safeParse(rawEnv)

  if (result.success) {
    validateAppCheckEnv(result.data)
    if (
      process.env.NODE_ENV === 'development' &&
      result.data.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo'
    ) {
      warnDevEnvFallback(result.data)
    }
    return result.data
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Invalid environment variables: ${formatZodErrors(result.error)}`
    )
  }

  if (hasAnyFirebaseEnv(rawEnv)) {
    throwInvalidEnv(result.error, 'partial or invalid .env.local')
  }

  const merged = {
    ...DEV_FIREBASE_DEFAULTS,
    ...pickDefinedFirebaseEnv(rawEnv),
  }
  const devResult = envSchema.safeParse(merged)

  if (devResult.success) {
    validateAppCheckEnv(devResult.data)
    warnDevEnvFallback(devResult.data)
    return devResult.data
  }

  throwInvalidEnv(devResult.error, 'demo defaults merge failed')
}

export const env = parseEnv()

export type Env = z.infer<typeof envSchema>

export { getServerEnv, resetServerEnvCache } from '@/lib/env-server'
export type { ServerEnv } from '@/lib/env-server'
