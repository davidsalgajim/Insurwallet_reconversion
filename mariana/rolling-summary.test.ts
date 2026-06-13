import { describe, expect, it } from 'vitest'

import {
  buildConversationContext,
  buildRollingSummary,
  formatHistoryForModel,
} from '@/mariana/rolling-summary'

describe('rolling summary', () => {
  it('keeps full history when under token threshold', () => {
    const turns = [
      { role: 'user' as const, content: '¿Qué cubre mi póliza?' },
      { role: 'assistant' as const, content: 'Cubre hospitalización básica.' },
    ]

    const context = buildConversationContext(turns)
    expect(context.rollingSummary).toBeNull()
    expect(context.recentTurns).toEqual(turns)
  })

  it('summarizes older turns when history is long', () => {
    const longParagraph =
      'cobertura de seguro de salud con detalle adicional '.repeat(20)
    const turns = Array.from({ length: 10 }, (_, index) => ({
      role: (index % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `${longParagraph} mensaje ${index}.`,
    }))

    const context = buildConversationContext(turns)
    expect(context.recentTurns.length).toBe(6)
    expect(context.rollingSummary).toContain('Usuario preguntó')
  })

  it('builds rolling summary bullets from older turns', () => {
    const summary = buildRollingSummary([
      { role: 'user', content: '¿Cuándo vence?' },
      { role: 'assistant', content: 'El 12 de diciembre.' },
    ])

    expect(summary).toContain('Usuario preguntó')
    expect(summary).toContain('MarIAna respondió')
  })

  it('formats history block for model context', () => {
    const block = formatHistoryForModel({
      rollingSummary: '- Usuario preguntó: hola',
      recentTurns: [{ role: 'user', content: '¿Prima?' }],
      locale: 'es',
    })

    expect(block).toContain('Resumen de la conversación anterior')
    expect(block).toContain('Usuario: ¿Prima?')
  })
})
