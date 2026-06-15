import { describe, expect, it } from 'vitest'

import { normalizeOptionalString } from '@/lib/utils/normalize-optional-string'

describe('normalizeOptionalString', () => {
  it.each(['none', 'N/A', 'null', 'pendiente', 'por definir', '  ninguno  '])(
    'drops sentinel %s',
    (value) => {
      expect(normalizeOptionalString(value)).toBe('')
    }
  )

  it('keeps real text values', () => {
    expect(normalizeOptionalString('Hospitalización')).toBe('Hospitalización')
  })

  it('returns empty for blank input', () => {
    expect(normalizeOptionalString('   ')).toBe('')
    expect(normalizeOptionalString(undefined)).toBe('')
  })
})
