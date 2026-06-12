import { describe, expect, it } from 'vitest'

import { generateShareToken, hashShareToken } from '@/lib/utils/share-token'

describe('share token utilities', () => {
  it('generates unique hex tokens', () => {
    const a = generateShareToken()
    const b = generateShareToken()
    expect(a).toHaveLength(64)
    expect(b).toHaveLength(64)
    expect(a).not.toBe(b)
  })

  it('hashes tokens deterministically', async () => {
    const token = 'test-token-value'
    const hashA = await hashShareToken(token)
    const hashB = await hashShareToken(token)
    expect(hashA).toBe(hashB)
    expect(hashA).toHaveLength(64)
  })
})
