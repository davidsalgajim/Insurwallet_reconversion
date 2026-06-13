import { PolicyTypeSchema } from '@/lib/schemas/policy'

import { autoScenarios } from './auto'
import { businessScenarios } from './business'
import { dentalScenarios } from './dental'
import { funeralScenarios } from './funeral'
import { healthScenarios } from './health'
import { homeScenarios } from './home'
import { lifeScenarios } from './life'
import { otherScenarios } from './other'
import { petScenarios } from './pet'
import { travelScenarios } from './travel'
import type { EvalScenario } from '../types'

export const SCENARIOS_BY_POLICY_TYPE = {
  life: lifeScenarios,
  health: healthScenarios,
  auto: autoScenarios,
  home: homeScenarios,
  travel: travelScenarios,
  pet: petScenarios,
  funeral: funeralScenarios,
  dental: dentalScenarios,
  business: businessScenarios,
  other: otherScenarios,
} as const satisfies Record<
  (typeof PolicyTypeSchema.options)[number],
  EvalScenario[]
>

export const ALL_EVAL_SCENARIOS: EvalScenario[] =
  PolicyTypeSchema.options.flatMap(
    (policyType) => SCENARIOS_BY_POLICY_TYPE[policyType]
  )

export {
  autoScenarios,
  businessScenarios,
  dentalScenarios,
  funeralScenarios,
  healthScenarios,
  homeScenarios,
  lifeScenarios,
  otherScenarios,
  petScenarios,
  travelScenarios,
}
