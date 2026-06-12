import { describe, expect, it } from 'vitest'

import { buildStubResponse, encodeSseChunk } from '@/mariana/respond'

describe('buildStubResponse', () => {
  it('returns tier0 placeholder for expiry questions', () => {
    const { fullText, chunks } = buildStubResponse(
      '¿Cuándo vence mi póliza de auto?',
      'es'
    )
    expect(fullText).toContain('vencimiento')
    expect(chunks.at(-1)?.type).toBe('done')
    expect(chunks[0]?.agent).toBe('tier0')
  })

  it('returns specialist placeholder for coverage questions', () => {
    const { fullText } = buildStubResponse(
      '¿Estoy cubierto para un viaje?',
      'en'
    )
    expect(fullText).toContain('coverage')
  })
})

describe('encodeSseChunk', () => {
  it('encodes chunks as SSE data lines', () => {
    const encoded = encodeSseChunk({ type: 'delta', content: 'hola' })
    expect(encoded).toBe('data: {"type":"delta","content":"hola"}\n\n')
  })
})
