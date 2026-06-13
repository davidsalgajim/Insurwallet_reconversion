import { estimateTokens } from '@/mariana/guardrails'

export type ChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export const ROLLING_SUMMARY_RECENT_TURNS = 6
export const ROLLING_SUMMARY_TOKEN_THRESHOLD = 4_000

export function buildRollingSummary(turns: ChatTurn[]): string {
  const lines: string[] = []

  for (const turn of turns) {
    const snippet = turn.content.replace(/\s+/g, ' ').trim().slice(0, 160)
    if (!snippet) {
      continue
    }

    if (turn.role === 'user') {
      lines.push(`- Usuario preguntó: ${snippet}`)
    } else {
      lines.push(`- MarIAna respondió: ${snippet}`)
    }
  }

  return lines.join('\n')
}

export function buildConversationContext(turns: ChatTurn[]): {
  rollingSummary: string | null
  recentTurns: ChatTurn[]
} {
  if (turns.length === 0) {
    return { rollingSummary: null, recentTurns: [] }
  }

  const totalTokens = turns.reduce(
    (sum, turn) => sum + estimateTokens(turn.content),
    0
  )

  if (
    totalTokens <= ROLLING_SUMMARY_TOKEN_THRESHOLD &&
    turns.length <= ROLLING_SUMMARY_RECENT_TURNS
  ) {
    return { rollingSummary: null, recentTurns: turns }
  }

  const recentTurns = turns.slice(-ROLLING_SUMMARY_RECENT_TURNS)
  const olderTurns = turns.slice(0, -ROLLING_SUMMARY_RECENT_TURNS)
  const rollingSummary =
    olderTurns.length > 0 ? buildRollingSummary(olderTurns) : null

  return { rollingSummary, recentTurns }
}

export function formatHistoryForModel(input: {
  rollingSummary: string | null
  recentTurns: ChatTurn[]
  locale: 'es' | 'en' | 'pt'
}): string {
  const parts: string[] = []

  if (input.rollingSummary) {
    const header =
      input.locale === 'en'
        ? 'Earlier conversation summary:'
        : input.locale === 'pt'
          ? 'Resumo da conversa anterior:'
          : 'Resumen de la conversación anterior:'
    parts.push(`${header}\n${input.rollingSummary}`)
  }

  for (const turn of input.recentTurns) {
    const label =
      turn.role === 'user'
        ? input.locale === 'en'
          ? 'User'
          : input.locale === 'pt'
            ? 'Usuário'
            : 'Usuario'
        : 'MarIAna'
    parts.push(`${label}: ${turn.content}`)
  }

  return parts.join('\n\n')
}
