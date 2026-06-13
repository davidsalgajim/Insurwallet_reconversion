import { describe, expect, it } from 'vitest'

import {
  countScenariosByType,
  evaluateScenario,
  runStructuralEvals,
} from './structural-eval'
import { ALL_EVAL_SCENARIOS, SCENARIOS_BY_POLICY_TYPE } from './scenarios/index'
import { PolicyTypeSchema } from '@/lib/schemas/policy'

describe('MarIAna eval scenario inventory', () => {
  it('defines at least 10 scenarios per PolicyType', () => {
    const counts = countScenariosByType()
    for (const policyType of PolicyTypeSchema.options) {
      expect(
        counts[policyType],
        `${policyType} scenario count`
      ).toBeGreaterThanOrEqual(10)
    }
  })

  it('aggregates 120 scenarios across 10 policy types', () => {
    expect(ALL_EVAL_SCENARIOS).toHaveLength(120)
    expect(Object.keys(SCENARIOS_BY_POLICY_TYPE)).toHaveLength(10)
  })
})

describe('MarIAna structural evals', () => {
  it('passes all routing/tool/prompt checks', () => {
    const summary = runStructuralEvals()

    for (const [policyType, bucket] of Object.entries(summary.byPolicyType)) {
      expect(bucket.failed, `${policyType} failures`).toBe(0)
      expect(bucket.passed).toBe(bucket.total)
    }

    expect(summary.failed).toBe(0)
    expect(summary.passed).toBe(summary.total)
    expect(summary.gaps).toEqual([])
  })

  it('reports failures with scenario id', () => {
    const [first] = ALL_EVAL_SCENARIOS
    expect(first).toBeDefined()
    const result = evaluateScenario(first!)
    expect(result.scenarioId).toBe(first!.id)
    expect(result.passed).toBe(true)
  })
})
