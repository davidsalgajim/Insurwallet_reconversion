import { afterEach, describe, expect, it } from 'vitest'

import { getServerEnv, normalizeResendFromEmail } from '@/lib/server/env-server'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('normalizeResendFromEmail', () => {
  it('returns undefined for empty or invalid values', () => {
    expect(normalizeResendFromEmail(undefined)).toBeUndefined()
    expect(normalizeResendFromEmail('')).toBeUndefined()
    expect(normalizeResendFromEmail('   ')).toBeUndefined()
    expect(normalizeResendFromEmail('not-an-email')).toBeUndefined()
    expect(normalizeResendFromEmail('InsurWallet <bad>')).toBeUndefined()
  })

  it('accepts plain email addresses', () => {
    expect(normalizeResendFromEmail('onboarding@resend.dev')).toBe(
      'onboarding@resend.dev'
    )
    expect(normalizeResendFromEmail('  noreply@yourdomain.com  ')).toBe(
      'noreply@yourdomain.com'
    )
  })

  it('accepts display-name format when the email part is valid', () => {
    expect(
      normalizeResendFromEmail('InsurWallet <noreply@yourdomain.com>')
    ).toBe('InsurWallet <noreply@yourdomain.com>')
  })
})

describe('getServerEnv', () => {
  it('does not throw when RESEND_FROM_EMAIL is invalid', () => {
    process.env.RESEND_FROM_EMAIL = 'InsurWallet <not-an-email>'
    expect(() => getServerEnv()).not.toThrow()
    expect(getServerEnv().RESEND_FROM_EMAIL).toBeUndefined()
  })

  it('preserves valid RESEND_FROM_EMAIL values', () => {
    process.env.RESEND_FROM_EMAIL = 'onboarding@resend.dev'
    expect(getServerEnv().RESEND_FROM_EMAIL).toBe('onboarding@resend.dev')
  })
})
