import type { PolicyAgentFieldsValues } from '@/components/policies/policy-agent-fields'
import {
  policyDocumentToFormValues,
  type PolicyBasicFieldsValues,
} from '@/components/policies/policy-basic-fields'
import {
  createEmptyBenefitRow,
  createEmptyCoverageRow,
  createEmptyDeductibleRow,
  type BenefitRow,
  type CoverageRow,
  type DeductibleRow,
} from '@/components/policies/policy-structured-fields'
import { toDateInputValue } from '@/components/policies/policy-form-styles'
import type { PolicyDocument } from '@/lib/firebase/policies'
import { resolveAgentForReview } from '@/lib/policies/extraction-mapping'
import type { PolicyExtraction } from '@/lib/schemas/extraction'
import {
  beneficiaryEntryToManualRow,
  type ManualBeneficiaryRow,
} from '@/lib/schemas/beneficiary'
import type {
  BeneficiaryEntry,
  BenefitEntry,
  CoverageEntry,
  DeductibleEntry,
} from '@/lib/schemas/policy'

function createRowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function entriesToRows<T extends { key: string }>(
  entries: Array<Omit<T, 'key'>>,
  factory: () => T
): T[] {
  if (entries.length === 0) {
    return []
  }
  return entries.map((entry) => ({ ...entry, key: createRowKey() }) as T)
}

export function coverageEntriesToRows(
  entries: CoverageEntry[] = []
): CoverageRow[] {
  return entriesToRows(entries, createEmptyCoverageRow)
}

export function deductibleEntriesToRows(
  entries: DeductibleEntry[] = []
): DeductibleRow[] {
  return entriesToRows(entries, createEmptyDeductibleRow)
}

export function benefitEntriesToRows(
  entries: BenefitEntry[] = []
): BenefitRow[] {
  return entriesToRows(entries, createEmptyBenefitRow)
}

export function beneficiaryEntriesToManualRows(
  entries: BeneficiaryEntry[] = []
): ManualBeneficiaryRow[] {
  return entries.map((entry) => beneficiaryEntryToManualRow(entry))
}

export function mergeBasicValuesFromExtraction(
  policy: PolicyDocument,
  extraction?: PolicyExtraction
): PolicyBasicFieldsValues {
  const base = policyDocumentToFormValues(policy)
  const fields = extraction?.fields
  if (!fields) {
    return base
  }

  return {
    ...base,
    insurerName: fields.insurerName ?? base.insurerName,
    policyNumber: fields.policyNumber ?? base.policyNumber,
    policyType: fields.policyType ?? base.policyType,
    holderName: fields.holderName ?? base.holderName,
    startDate: fields.startDate
      ? toDateInputValue(fields.startDate)
      : base.startDate,
    endDate: fields.endDate
      ? toDateInputValue(fields.endDate)
      : fields.hasNoExpiration
        ? ''
        : base.endDate,
    hasNoExpiration: fields.hasNoExpiration ?? base.hasNoExpiration,
    premium:
      fields.premium != null && fields.premium > 0
        ? String(fields.premium)
        : base.premium,
    currency: fields.currency ?? base.currency,
    paymentFrequency: fields.paymentFrequency ?? base.paymentFrequency,
    coverages: fields.coverages ?? base.coverages,
    beneficiaries: fields.beneficiaries ?? base.beneficiaries,
    exclusions: fields.exclusions ?? base.exclusions,
    waitingPeriods: fields.waitingPeriods ?? base.waitingPeriods,
    notes: fields.notes ?? base.notes,
  }
}

export function mergeAgentFromExtraction(
  policy: PolicyDocument,
  extraction?: PolicyExtraction
): PolicyAgentFieldsValues {
  const agent = resolveAgentForReview(extraction?.fields, policy)

  return {
    agentName: agent?.name ?? '',
    agentPhone: agent?.phone ?? '',
    agentEmail: agent?.email ?? '',
  }
}

export function mergeStructuredRowsFromExtraction(
  policy: PolicyDocument,
  extraction?: PolicyExtraction
): {
  coverageRows: CoverageRow[]
  deductibleRows: DeductibleRow[]
  benefitRows: BenefitRow[]
  beneficiaryRows: ManualBeneficiaryRow[]
} {
  const fields = extraction?.fields
  return {
    coverageRows: coverageEntriesToRows(
      fields?.coverageEntries ?? policy.coverageEntries
    ),
    deductibleRows: deductibleEntriesToRows(
      fields?.deductibleEntries ?? policy.deductibleEntries
    ),
    benefitRows: benefitEntriesToRows(
      fields?.benefitEntries ?? policy.benefitEntries
    ),
    beneficiaryRows: beneficiaryEntriesToManualRows(
      fields?.beneficiaryEntries ?? policy.beneficiaryEntries
    ),
  }
}
