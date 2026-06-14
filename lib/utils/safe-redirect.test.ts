import { describe, expect, it } from 'vitest'

import { safeRedirect, stripLocalePrefix } from '@/lib/utils/safe-redirect'

describe('stripLocalePrefix', () => {
  it('removes locale from app paths', () => {
    expect(stripLocalePrefix('/es/dashboard')).toBe('/dashboard')
    expect(stripLocalePrefix('/en/policies/new/upload')).toBe(
      '/policies/new/upload'
    )
  })

  it('leaves locale-free paths unchanged', () => {
    expect(stripLocalePrefix('/dashboard')).toBe('/dashboard')
  })
})

describe('safeRedirect', () => {
  it('normalizes encoded locale-prefixed redirects from middleware', () => {
    expect(safeRedirect('%2Fes%2Fdashboard')).toBe('/dashboard')
  })

  it('rejects open redirects', () => {
    expect(safeRedirect('https://evil.test')).toBe('/dashboard')
    expect(safeRedirect('//evil.test')).toBe('/dashboard')
  })
})
