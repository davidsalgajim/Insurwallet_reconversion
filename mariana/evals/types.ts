import type { PolicyType } from '@/lib/schemas/policy'
import type { MarianaAgentId, SituationalIntent } from '@/mariana/types'
import type { MarianaToolName } from '@/mariana/tools'

export type ExpectedRoute = {
  agent: MarianaAgentId
  situationalIntent?: SituationalIntent
  policyTypes?: PolicyType[]
  minConfidence?: number
}

export type ExpectedBehavior = {
  route: ExpectedRoute
  tools?: MarianaToolName[]
  shouldAsk?: string[]
  shouldMention?: string[]
}

export type EvalScenario = {
  id: string
  policyType: PolicyType
  message: string
  locale?: 'es' | 'en' | 'pt'
  expectedBehavior: ExpectedBehavior
  notes?: string
}

export type StructuralEvalResult = {
  scenarioId: string
  passed: boolean
  failures: string[]
}

export type StructuralEvalSummary = {
  total: number
  passed: number
  failed: number
  byPolicyType: Record<
    PolicyType,
    { total: number; passed: number; failed: number }
  >
  gaps: string[]
}
