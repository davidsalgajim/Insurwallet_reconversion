import { describe, expect, it } from 'vitest'

import { isAxeEnabled, runAxeCheck } from './axe-vitest-stub'

describe('axe vitest stub', () => {
  it('is disabled by default', () => {
    expect(isAxeEnabled()).toBe(false)
  })

  it('returns no violations when axe is disabled', async () => {
    await expect(runAxeCheck()).resolves.toEqual([])
  })
})
