import { describe, expect, it } from 'vitest'

import {
  chunkText,
  estimateTokenCount,
  scoreChunkMatch,
} from '@/lib/server/document-chunks'

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
