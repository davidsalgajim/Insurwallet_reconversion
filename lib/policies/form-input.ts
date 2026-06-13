import type { PolicyAgentFieldsValues } from '@/components/policies/policy-agent-fields'
import type { PolicyBasicFieldsValues } from '@/components/policies/policy-basic-fields'
import {
  sanitizeBenefitRows,
  sanitizeCoverageRows,
  sanitizeDeductibleRows,
  type BenefitRow,
  type CoverageRow,
  type DeductibleRow,
} from '@/components/policies/policy-structured-fields'
import type { CreatePolicyInput } from '@/lib/firebase/policies'
import {
  type ManualBeneficiaryRow,
  sanitizeManualBeneficiaryRows,
} from '@/lib/schemas/beneficiary'
import type { BeneficiaryEntry } from '@/lib/schemas/policy'

export function buildCreateInputFromForm(
  values: PolicyBasicFieldsValues,
  agent: PolicyAgentFieldsValues,
  coverageRows: CoverageRow[],
  deductibleRows: DeductibleRow[],
  benefitRows: BenefitRow[],
  beneficiaryRows: Array<ManualBeneficiaryRow & { key?: string }>,
  ownerUid: string
): CreatePolicyInput {
  return {
    ownerUid,
    insurerName: values.insurerName.trim(),
    policyNumber: values.policyNumber.trim(),
    policyType: values.policyType,
    holderName: values.holderName.trim() || values.insurerName.trim(),
    startDate: new Date(values.startDate),
    endDate: values.hasNoExpiration
      ? new Date(values.startDate)
      : new Date(values.endDate),
    hasNoExpiration: values.hasNoExpiration,
    premium: values.premium ? Number(values.premium) : 0,
    currency: values.currency.trim() || 'COP',
    paymentFrequency: values.paymentFrequency,
    coverages: values.coverages.trim() || undefined,
    beneficiaries: values.beneficiaries.trim() || undefined,
    exclusions: values.exclusions.trim() || undefined,
    waitingPeriods: values.waitingPeriods.trim() || undefined,
    notes: values.notes.trim() || undefined,
    agent: {
      name: agent.agentName.trim() || undefined,
      phone: agent.agentPhone.trim() || undefined,
      email: agent.agentEmail.trim() || undefined,
    },
    coverageEntries: sanitizeCoverageRows(coverageRows),
    deductibleEntries: sanitizeDeductibleRows(deductibleRows),
    benefitEntries: sanitizeBenefitRows(benefitRows),
    beneficiaryEntries: sanitizeManualBeneficiaryRows(
      beneficiaryRows.map(({ key: _key, ...row }) => row)
    ),
  }
}

export async function syncPolicyBeneficiaries(
  policyId: string,
  beneficiaries: BeneficiaryEntry[]
): Promise<void> {
  const existingRes = await fetch(`/api/policies/${policyId}/beneficiaries`)
  if (!existingRes.ok) {
    throw new Error('Failed to load beneficiaries')
  }
  const existingPayload = (await existingRes.json()) as {
    beneficiaries: Array<{ id: string }>
  }

  await Promise.all(
    existingPayload.beneficiaries.map((row) =>
      fetch(`/api/policies/${policyId}/beneficiaries/${row.id}`, {
        method: 'DELETE',
      })
    )
  )

  await Promise.all(
    beneficiaries.map((entry) =>
      fetch(`/api/policies/${policyId}/beneficiaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entry.name,
          pct: entry.pct,
          notes: entry.notes,
        }),
      })
    )
  )
}
