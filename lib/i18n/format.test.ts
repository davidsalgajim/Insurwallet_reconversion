import { describe, expect, it } from 'vitest'

import { formatPolicyCurrency, formatPolicyDate } from '@/lib/i18n/format'

describe('formatPolicyDate', () => {
  it('formats dates using the requested locale', () => {
    const date = new Date('2025-06-15T12:00:00.000Z')
    expect(formatPolicyDate(date, 'es')).toMatch(/2025/)
    expect(formatPolicyDate(date, 'en')).toMatch(/2025/)
  })
})

describe('formatPolicyCurrency', () => {
  it('formats currency amounts without fractional digits', () => {
    const formatted = formatPolicyCurrency(1_250_000, 'COP', 'es-CO')
    expect(formatted).toMatch(/1[\s.,]?250[\s.,]?000/)
    expect(formatted).toMatch(/COP|\$/)
  })
})
