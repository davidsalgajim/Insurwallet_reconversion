import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import { planPrefetchToolCalls } from '@/lib/server/mariana-tools'
import { getAgentSystemPromptWithSpecialist } from '@/mariana/agents'
import { routeMessage } from '@/mariana/router'
import { makePolicyMetadata } from '@/mariana/test-fixtures'
import type { PolicyMetadata } from '@/mariana/types'
import type { ToolContext } from '@/mariana/tools'

import type {
  EvalScenario,
  StructuralEvalResult,
  StructuralEvalSummary,
} from './types'
import { ALL_EVAL_SCENARIOS } from './scenarios/index'

const DEFAULT_TOOL_CONTEXT: ToolContext = {
  uid: 'eval-user',
  ownedPolicyIds: ['policy-eval'],
  sharedPolicyIds: [],
}

function policiesForType(policyType: EvalScenario['policyType']): {
  metadata: PolicyMetadata[]
} {
  const metadata = [
    makePolicyMetadata({
      id: 'policy-eval',
      policyType,
      policyNumber: `${policyType.toUpperCase()}-EVAL`,
      insurerName: 'Eval Insurer',
    }),
  ]
  return { metadata }
}

function missingPromptTerms(prompt: string, terms: string[]): string[] {
  const normalizedPrompt = prompt.toLowerCase()
  return terms.filter((term) => !normalizedPrompt.includes(term.toLowerCase()))
}

export function evaluateScenario(scenario: EvalScenario): StructuralEvalResult {
  const failures: string[] = []
  const { metadata } = policiesForType(scenario.policyType)
  const locale = scenario.locale ?? 'es'

  const decision = routeMessage(scenario.message, metadata)
  const expected = scenario.expectedBehavior

  if (decision.agent !== expected.route.agent) {
    failures.push(
      `route.agent expected ${expected.route.agent}, got ${decision.agent}`
    )
  }

  if (
    expected.route.situationalIntent &&
    decision.entities.situationalIntent !== expected.route.situationalIntent
  ) {
    failures.push(
      `route.situationalIntent expected ${expected.route.situationalIntent}, got ${decision.entities.situationalIntent ?? 'undefined'}`
    )
  }

  if (expected.route.policyTypes) {
    const actual = decision.entities.policyTypes ?? []
    const missing = expected.route.policyTypes.filter(
      (type) => !actual.includes(type)
    )
    if (missing.length > 0) {
      failures.push(`route.policyTypes missing ${missing.join(', ')}`)
    }
  }

  if (expected.route.minConfidence !== undefined) {
    if (decision.confidence < expected.route.minConfidence) {
      failures.push(
        `route.confidence ${decision.confidence} below ${expected.route.minConfidence}`
      )
    }
  }

  if (expected.tools?.length) {
    const planned = planPrefetchToolCalls({
      agent: decision.agent,
      policyHint: decision.entities.policyHint,
      message: scenario.message,
      context: DEFAULT_TOOL_CONTEXT,
      decision,
    })
    const toolNames = planned.map((call) => call.name)
    for (const tool of expected.tools) {
      if (!toolNames.includes(tool)) {
        failures.push(`prefetch missing tool ${tool}`)
      }
    }
  }

  const prompt =
    getAgentSystemPromptWithSpecialist({
      agentId: decision.agent,
      locale,
      situationalIntent: decision.entities.situationalIntent,
      policyTypes: decision.entities.policyTypes,
    }) ?? ''

  if (expected.shouldAsk?.length) {
    const missing = missingPromptTerms(prompt, expected.shouldAsk)
    if (missing.length > 0) {
      failures.push(`prompt missing shouldAsk terms: ${missing.join(', ')}`)
    }
  }

  if (expected.shouldMention?.length) {
    const missing = missingPromptTerms(prompt, expected.shouldMention)
    if (missing.length > 0) {
      failures.push(`prompt missing shouldMention terms: ${missing.join(', ')}`)
    }
  }

  return {
    scenarioId: scenario.id,
    passed: failures.length === 0,
    failures,
  }
}

export function runStructuralEvals(
  scenarios: EvalScenario[] = ALL_EVAL_SCENARIOS
): StructuralEvalSummary {
  const results = scenarios.map(evaluateScenario)
  const byPolicyType = {} as StructuralEvalSummary['byPolicyType']

  for (const scenario of scenarios) {
    const bucket = byPolicyType[scenario.policyType] ?? {
      total: 0,
      passed: 0,
      failed: 0,
    }
    bucket.total += 1
    byPolicyType[scenario.policyType] = bucket
  }

  for (const result of results) {
    const scenario = scenarios.find((entry) => entry.id === result.scenarioId)
    if (!scenario) {
      continue
    }
    const bucket = byPolicyType[scenario.policyType]!
    if (result.passed) {
      bucket.passed += 1
    } else {
      bucket.failed += 1
    }
  }

  const gaps: string[] = []
  const policyTypes = Object.keys(byPolicyType) as EvalScenario['policyType'][]
  for (const policyType of policyTypes) {
    const bucket = byPolicyType[policyType]
    if (!bucket || bucket.total < 10) {
      gaps.push(
        `${policyType}: fewer than 10 scenarios (${bucket?.total ?? 0})`
      )
    }
  }

  const failed = results.filter((result) => !result.passed)
  if (failed.length > 0) {
    gaps.push(`${failed.length} scenario(s) failed structural checks`)
  }

  return {
    total: scenarios.length,
    passed: results.filter((result) => result.passed).length,
    failed: failed.length,
    byPolicyType,
    gaps,
  }
}

export function countScenariosByType(
  scenarios: EvalScenario[] = ALL_EVAL_SCENARIOS
): Record<EvalScenario['policyType'], number> {
  return scenarios.reduce(
    (acc, scenario) => {
      acc[scenario.policyType] = (acc[scenario.policyType] ?? 0) + 1
      return acc
    },
    {} as Record<EvalScenario['policyType'], number>
  )
}
