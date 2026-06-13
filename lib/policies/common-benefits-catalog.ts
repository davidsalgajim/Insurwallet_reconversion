import type { PolicyType } from '@/lib/schemas/policy'

export type CommonBenefitSuggestion = {
  id: string
  labelKey: string
}

const COMMON_BENEFITS_BY_TYPE: Record<PolicyType, CommonBenefitSuggestion[]> = {
  life: [
    { id: 'death-benefit', labelKey: 'deathBenefit' },
    { id: 'accidental-death', labelKey: 'accidentalDeath' },
    { id: 'disability', labelKey: 'disability' },
    { id: 'funeral', labelKey: 'funeral' },
  ],
  health: [
    { id: 'hospitalization', labelKey: 'hospitalization' },
    { id: 'specialists', labelKey: 'specialists' },
    { id: 'medications', labelKey: 'medications' },
    { id: 'maternity', labelKey: 'maternity' },
    { id: 'dental', labelKey: 'dental' },
  ],
  auto: [
    { id: 'collision', labelKey: 'collision' },
    { id: 'theft', labelKey: 'theft' },
    { id: 'third-party', labelKey: 'thirdParty' },
    { id: 'roadside', labelKey: 'roadside' },
    { id: 'glass', labelKey: 'glass' },
  ],
  home: [
    { id: 'fire', labelKey: 'fire' },
    { id: 'theft', labelKey: 'theft' },
    { id: 'water-damage', labelKey: 'waterDamage' },
    { id: 'civil-liability', labelKey: 'civilLiability' },
    { id: 'contents', labelKey: 'contents' },
  ],
  travel: [
    { id: 'medical-abroad', labelKey: 'medicalAbroad' },
    { id: 'trip-cancellation', labelKey: 'tripCancellation' },
    { id: 'baggage', labelKey: 'baggage' },
    { id: 'repatriation', labelKey: 'repatriation' },
  ],
  pet: [
    { id: 'vet-visits', labelKey: 'vetVisits' },
    { id: 'surgery', labelKey: 'surgery' },
    { id: 'medications', labelKey: 'medications' },
    { id: 'liability', labelKey: 'liability' },
  ],
  funeral: [
    { id: 'funeral', labelKey: 'funeral' },
    { id: 'death-benefit', labelKey: 'deathBenefit' },
    { id: 'repatriation', labelKey: 'repatriation' },
  ],
  dental: [
    { id: 'dental', labelKey: 'dental' },
    { id: 'orthodontics', labelKey: 'orthodontics' },
    { id: 'preventive', labelKey: 'preventive' },
  ],
  business: [
    { id: 'property', labelKey: 'property' },
    { id: 'civil-liability', labelKey: 'civilLiability' },
    { id: 'business-interruption', labelKey: 'businessInterruption' },
    { id: 'employees', labelKey: 'employees' },
  ],
  other: [
    { id: 'general-coverage', labelKey: 'generalCoverage' },
    { id: 'deductible', labelKey: 'deductible' },
    { id: 'exclusions', labelKey: 'exclusions' },
  ],
}

export function getCommonBenefitsForPolicyType(
  policyType: PolicyType
): CommonBenefitSuggestion[] {
  return COMMON_BENEFITS_BY_TYPE[policyType]
}

export function benefitAlreadyMentioned(
  coveragesText: string | undefined,
  benefitLabel: string
): boolean {
  if (!coveragesText?.trim()) {
    return false
  }

  const normalizedCoverages = coveragesText.toLowerCase()
  const normalizedLabel = benefitLabel.toLowerCase()

  return (
    normalizedCoverages.includes(normalizedLabel) ||
    normalizedLabel
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .some((word) => normalizedCoverages.includes(word))
  )
}
