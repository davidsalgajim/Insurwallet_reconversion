import { describe, expect, it } from 'vitest'

import {
  NotificationChannelsSchema,
  UserPreferencesSchema,
  defaultNotificationChannels,
  defaultNotificationPrefs,
  defaultUserPreferences,
} from './user'

describe('NotificationChannelsSchema', () => {
  it('accepts email only, push only, and both', () => {
    expect(
      NotificationChannelsSchema.safeParse({ email: true, push: false }).success
    ).toBe(true)
    expect(
      NotificationChannelsSchema.safeParse({ email: false, push: true }).success
    ).toBe(true)
    expect(
      NotificationChannelsSchema.safeParse({ email: true, push: true }).success
    ).toBe(true)
  })

  it('rejects when both channels are disabled', () => {
    const result = NotificationChannelsSchema.safeParse({
      email: false,
      push: false,
    })

    expect(result.success).toBe(false)
  })
})

describe('notification defaults', () => {
  it('defaults to email on and push off', () => {
    expect(defaultNotificationChannels()).toEqual({
      email: true,
      push: false,
    })
  })

  it('provides event preference defaults', () => {
    expect(defaultNotificationPrefs().expiry30).toBe(true)
    expect(defaultNotificationPrefs().events).toBe(false)
  })
})

describe('UserPreferencesSchema', () => {
  it('defaults to COP', () => {
    expect(defaultUserPreferences()).toEqual({ currency: 'COP' })
  })

  it('accepts supported LATAM currencies', () => {
    expect(UserPreferencesSchema.safeParse({ currency: 'MXN' }).success).toBe(
      true
    )
  })
})
