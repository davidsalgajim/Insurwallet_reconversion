export type AppCheckEnvInput = {
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS?: boolean
  NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY?: string
  NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN?: string
}

export function validateAppCheckEnv(data: AppCheckEnvInput): void {
  const isHostedDeploy =
    process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV)
  const isHostedProduction = process.env.VERCEL_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const useEmulators = data.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === true

  if (
    isHostedProduction &&
    !data.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY?.trim()
  ) {
    throw new Error(
      '[env] NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY is required when VERCEL_ENV=production.'
    )
  }

  if (
    data.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN &&
    !useEmulators &&
    !isDevelopment &&
    isHostedDeploy
  ) {
    throw new Error(
      '[env] NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN is only allowed with emulators or NODE_ENV=development.'
    )
  }
}
