import { describe, expect, it } from 'vitest'

import {
  chunkText,
  combineChunkScores,
  cosineSimilarity,
  estimateTokenCount,
  resolveIndexingText,
  scoreChunkMatch,
} from '@/lib/server/document-chunks'
import { EMBEDDING_DIMENSION } from '@/lib/server/embeddings'

describe('document chunking', () => {
  it('splits long text into ~500-token chunks', () => {
    const text = `${'Póliza de seguro con cobertura amplia. '.repeat(120)}Exclusión por guerra.`
    const chunks = chunkText(text, 'doc-1', 'policy.pdf')

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]?.docId).toBe('doc-1')
    expect(chunks[0]?.tokenCount).toBeGreaterThan(0)
  })

  it('estimates token count from character length', () => {
    expect(estimateTokenCount('abcd')).toBe(1)
  })
})

describe('scoreChunkMatch', () => {
  it('scores chunks by query term overlap', () => {
    expect(
      scoreChunkMatch('Exclusión por deportes extremos', 'exclusión deportes')
    ).toBeGreaterThan(0)
    expect(scoreChunkMatch('Cobertura básica', 'exclusión')).toBe(0)
  })
})

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0)
  })
})

describe('combineChunkScores', () => {
  it('uses keyword score alone when vector score is zero', () => {
    expect(combineChunkScores(0.8, 0)).toBe(0.8)
  })

  it('boosts ranking with vector similarity', () => {
    const hybrid = combineChunkScores(0.2, 0.9)
    const keywordOnly = combineChunkScores(0.2, 0)
    expect(hybrid).toBeGreaterThan(keywordOnly)
  })
})

describe('resolveIndexingText', () => {
  it('prefers full document transcript over policy supplement', async () => {
    const longTranscript = `Exclusión por deportes extremos. ${'Cobertura amplia. '.repeat(40)}`
    const text = await resolveIndexingText({
      document: { extractedSummary: longTranscript },
      policy: { exclusions: 'Exclusión por guerra' },
    })

    expect(text).toBe(longTranscript.trim())
    expect(text).not.toContain('Exclusión por guerra')
  })

  it('merges policy supplement when document text is short', async () => {
    const text = await resolveIndexingText({
      document: { extractedSummary: 'Carátula' },
      policy: {
        coverages: 'Muerte accidental',
        exclusions: 'Guerra y terrorismo',
      },
    })

    expect(text).toContain('Carátula')
    expect(text).toContain('Muerte accidental')
    expect(text).toContain('Guerra y terrorismo')
  })
})

describe('chunk embeddings shape', () => {
  it('expects 768-dimensional vectors per schema', () => {
    const vector = Array.from({ length: EMBEDDING_DIMENSION }, () => 0.01)
    expect(vector).toHaveLength(768)
  })
})
