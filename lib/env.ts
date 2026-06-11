import { z } from 'zod'

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
})

function formatZodErrors(error: z.ZodError): string {
  return Object.entries(error.flatten().fieldErrors)
    .map(
      ([field, messages]) => `${field}: ${messages?.join(', ') ?? 'invalid'}`
    )
    .join('; ')
}

function parseEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Invalid environment variables: ${formatZodErrors(result.error)}`
      )
    }
    return {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'demo',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'insurwallet-staging',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'insurwallet-staging.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:demo',
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: true,
    }
  }

  return result.data
}

export const env = parseEnv()

export type Env = z.infer<typeof envSchema>
