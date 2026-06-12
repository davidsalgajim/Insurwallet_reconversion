import {
  buildCoveragePrompt,
  COVERAGE_AGENT_ID,
} from '@/mariana/agents/coverage'
import {
  buildDocumentalPrompt,
  DOCUMENTAL_AGENT_ID,
} from '@/mariana/agents/documental'
import {
  buildEmergencyPrompt,
  EMERGENCY_AGENT_ID,
} from '@/mariana/agents/emergency'
import { buildExpiryPrompt, EXPIRY_AGENT_ID } from '@/mariana/agents/expiry'
import {
  buildInsurersPrompt,
  INSURERS_AGENT_ID,
} from '@/mariana/agents/insurers'
import type { MarianaAgentId } from '@/mariana/types'

const AGENT_PROMPT_BUILDERS: Partial<
  Record<MarianaAgentId, (locale: string) => string>
> = {
  [DOCUMENTAL_AGENT_ID]: buildDocumentalPrompt,
  [COVERAGE_AGENT_ID]: buildCoveragePrompt,
  [EXPIRY_AGENT_ID]: buildExpiryPrompt,
  [INSURERS_AGENT_ID]: buildInsurersPrompt,
  [EMERGENCY_AGENT_ID]: buildEmergencyPrompt,
}

export function getAgentSystemPrompt(
  agentId: MarianaAgentId,
  locale: string
): string | null {
  const builder = AGENT_PROMPT_BUILDERS[agentId]
  return builder ? builder(locale) : null
}

export { buildCoveragePrompt, buildDocumentalPrompt }
