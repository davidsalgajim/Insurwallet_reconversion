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
import {
  getSpecialistPromptForIntent,
  getSpecialistPromptForPolicyType,
} from '@/mariana/agents/specialists'
import { primaryPolicyTypeForIntent } from '@/mariana/situational'
import { PolicyTypeSchema, type PolicyType } from '@/lib/schemas/policy'
import type { MarianaAgentId, SituationalIntent } from '@/mariana/types'

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

export function getAgentSystemPromptWithSpecialist(input: {
  agentId: MarianaAgentId
  locale: string
  situationalIntent?: SituationalIntent
  policyTypes?: string[]
}): string | null {
  const base = getAgentSystemPrompt(input.agentId, input.locale)
  if (!base) {
    return null
  }

  const specialistPolicyType = resolveSpecialistPolicyType(input)
  if (!specialistPolicyType) {
    return base
  }

  const specialist = getSpecialistPromptForPolicyType(
    specialistPolicyType,
    input.locale
  )
  return `${base}\n\n---\nType-specific guidance:\n${specialist}`
}

function resolveSpecialistPolicyType(input: {
  situationalIntent?: SituationalIntent
  policyTypes?: string[]
}): PolicyType | null {
  if (input.situationalIntent) {
    return primaryPolicyTypeForIntent(input.situationalIntent)
  }

  const candidate = input.policyTypes?.[0]
  if (!candidate) {
    return null
  }

  const parsed = PolicyTypeSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export {
  buildCoveragePrompt,
  buildDocumentalPrompt,
  getSpecialistPromptForIntent,
}
