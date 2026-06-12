export type FeatureFlags = {
  paymentsEnabled: boolean
  marianaEnabled: boolean
  suryaFallback: boolean
}

function readBooleanEnv(
  publicKey: string | undefined,
  serverKey: string | undefined,
  defaultValue: boolean
): boolean {
  const value = publicKey ?? serverKey
  if (value === undefined || value.trim() === '') {
    return defaultValue
  }

  return value !== 'false' && value !== '0'
}

/** Env-var fallback for Remote Config (task 5.5). */
export function getFeatureFlags(
  env: NodeJS.ProcessEnv = process.env
): FeatureFlags {
  return {
    paymentsEnabled: readBooleanEnv(
      env.NEXT_PUBLIC_PAYMENTS_ENABLED,
      env.PAYMENTS_ENABLED,
      true
    ),
    marianaEnabled: readBooleanEnv(
      env.NEXT_PUBLIC_MARIANA_ENABLED,
      env.MARIANA_ENABLED,
      true
    ),
    suryaFallback: readBooleanEnv(
      env.NEXT_PUBLIC_SURYA_FALLBACK,
      env.SURYA_FALLBACK,
      true
    ),
  }
}

export function getClientFeatureFlags(): Pick<
  FeatureFlags,
  'paymentsEnabled' | 'marianaEnabled'
> {
  return {
    paymentsEnabled:
      process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== 'false' &&
      process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== '0',
    marianaEnabled:
      process.env.NEXT_PUBLIC_MARIANA_ENABLED !== 'false' &&
      process.env.NEXT_PUBLIC_MARIANA_ENABLED !== '0',
  }
}
