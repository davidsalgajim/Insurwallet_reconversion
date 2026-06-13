import type { PolicyType } from '@/lib/schemas/policy'
import type { SituationalIntent } from '@/mariana/types'
import { primaryPolicyTypeForIntent } from '@/mariana/situational'

import { buildAutoSpecialistPrompt } from './auto'
import { buildBusinessSpecialistPrompt } from './business'
import { buildDentalSpecialistPrompt } from './dental'
import { buildFuneralSpecialistPrompt } from './funeral'
import { buildHealthSpecialistPrompt } from './health'
import { buildHomeSpecialistPrompt } from './home'
import { buildLifeSpecialistPrompt } from './life'
import { buildOtherSpecialistPrompt } from './other'
import { buildPetSpecialistPrompt } from './pet'
import { buildTravelSpecialistPrompt } from './travel'

const SPECIALIST_BUILDERS: Record<PolicyType, (locale: string) => string> = {
  life: buildLifeSpecialistPrompt,
  health: buildHealthSpecialistPrompt,
  auto: buildAutoSpecialistPrompt,
  home: buildHomeSpecialistPrompt,
  travel: buildTravelSpecialistPrompt,
  pet: buildPetSpecialistPrompt,
  funeral: buildFuneralSpecialistPrompt,
  dental: buildDentalSpecialistPrompt,
  business: buildBusinessSpecialistPrompt,
  other: buildOtherSpecialistPrompt,
}

export function getSpecialistPromptForPolicyType(
  policyType: PolicyType,
  locale: string
): string {
  return SPECIALIST_BUILDERS[policyType](locale)
}

export function getSpecialistPromptForIntent(
  intent: SituationalIntent,
  locale: string
): string {
  return getSpecialistPromptForPolicyType(
    primaryPolicyTypeForIntent(intent),
    locale
  )
}

export {
  buildAutoSpecialistPrompt,
  buildBusinessSpecialistPrompt,
  buildDentalSpecialistPrompt,
  buildFuneralSpecialistPrompt,
  buildHealthSpecialistPrompt,
  buildHomeSpecialistPrompt,
  buildLifeSpecialistPrompt,
  buildOtherSpecialistPrompt,
  buildPetSpecialistPrompt,
  buildTravelSpecialistPrompt,
}
