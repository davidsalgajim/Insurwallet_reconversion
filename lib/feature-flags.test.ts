import { describe, expect, it } from 'vitest'

import { getFeatureFlags } from '@/lib/feature-flags'

describe('feature flags', () => {
  const testEnv = { NODE_ENV: 'test' } as NodeJS.ProcessEnv

  it('defaults payments and mariana to enabled', () => {
    const flags = getFeatureFlags(testEnv)
    expect(flags.paymentsEnabled).toBe(true)
    expect(flags.marianaEnabled).toBe(true)
  })

  it('disables payments when env is false', () => {
    const flags = getFeatureFlags({
      ...testEnv,
      PAYMENTS_ENABLED: 'false',
      MARIANA_ENABLED: '0',
    })
    expect(flags.paymentsEnabled).toBe(false)
    expect(flags.marianaEnabled).toBe(false)
  })
})
