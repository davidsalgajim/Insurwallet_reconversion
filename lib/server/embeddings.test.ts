import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  EMBEDDING_DIMENSION,
  embedText,
  embedTexts,
  isEmbeddingsConfigured,
} from '@/lib/server/embeddings'

function mockVector(seed: number): number[] {
  return Array.from({ length: EMBEDDING_DIMENSION }, (_, index) =>
    Math.sin(seed + index * 0.01)
  )
}

describe('embeddings', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.EMBEDDING_API_KEY
    delete process.env.GOOGLE_AI_API_KEY
  })

  it('reports unconfigured when no API key is set', () => {
    expect(isEmbeddingsConfigured()).toBe(false)
  })

  it('embeds text via Google Generative Language API', async () => {
    process.env.GOOGLE_AI_API_KEY = 'test-key'
    const vector = mockVector(1)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ embedding: { values: vector } }),
      }))
    )

    const result = await embedText('cobertura por accidente')
    expect(result).toEqual(vector)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('batch embeds multiple texts', async () => {
    process.env.EMBEDDING_API_KEY = 'batch-key'
    const vectors = [mockVector(2), mockVector(3)]

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          embeddings: vectors.map((values) => ({ values })),
        }),
      }))
    )

    const results = await embedTexts(['chunk a', 'chunk b'])
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual(vectors[0])
    expect(results[1]).toEqual(vectors[1])
  })

  it('returns null when API responds with wrong dimension', async () => {
    process.env.EMBEDDING_API_KEY = 'bad-key'

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ embedding: { values: [0.1, 0.2] } }),
      }))
    )

    expect(await embedText('test')).toBeNull()
  })
})
