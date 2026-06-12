import {
  buildCoveragePrompt,
  COVERAGE_AGENT_ID,
} from '@/mariana/agents/coverage'
import {
  buildDocumentalPrompt,
  DOCUMENTAL_AGENT_ID,
} from '@/mariana/agents/documental'
import type { MarianaAgentId } from '@/mariana/types'

const AGENT_PROMPT_BUILDERS: Partial<
  Record<MarianaAgentId, (locale: string) => string>
> = {
  [DOCUMENTAL_AGENT_ID]: buildDocumentalPrompt,
  [COVERAGE_AGENT_ID]: buildCoveragePrompt,
}

export function getAgentSystemPrompt(
  agentId: MarianaAgentId,
  locale: string
): string | null {
  const builder = AGENT_PROMPT_BUILDERS[agentId]
  return builder ? builder(locale) : null
}

export { buildCoveragePrompt, buildDocumentalPrompt }
