import type { PolicyAgentFieldsValues } from '@/components/policies/policy-agent-fields'
import type { ManualBeneficiaryRow } from '@/lib/schemas/beneficiary'
import {
  agentFieldsToContactInput,
  manualRowToGlobalBeneficiaryInput,
} from '@/lib/policies/saved-directory'

export async function saveAdvisorToContacts(
  agent: PolicyAgentFieldsValues
): Promise<void> {
  const body = agentFieldsToContactInput(agent)
  if (!body) {
    return
  }

  const response = await fetch('/api/user/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Failed to save advisor contact')
  }
}

export async function saveBeneficiaryToDirectory(
  row: ManualBeneficiaryRow
): Promise<void> {
  const body = manualRowToGlobalBeneficiaryInput(row)
  if (!body) {
    return
  }

  const response = await fetch('/api/user/beneficiaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Failed to save global beneficiary')
  }
}

export async function saveMarkedBeneficiaries(
  rows: Array<{ row: ManualBeneficiaryRow; save: boolean }>
): Promise<void> {
  const toSave = rows.filter((entry) => entry.save)
  if (toSave.length === 0) {
    return
  }

  await Promise.all(
    toSave.map((entry) => saveBeneficiaryToDirectory(entry.row))
  )
}
