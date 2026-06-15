import type { PolicyAgentFieldsValues } from '@/components/policies/policy-agent-fields'
import type { ManualBeneficiaryRow } from '@/lib/schemas/beneficiary'
import type { BeneficiaryIdType } from '@/lib/schemas/policy'
import type {
  GlobalBeneficiaryInput,
  InsuranceContactInput,
  InsuranceContactType,
} from '@/lib/schemas/user-contacts'

export type SavedAdvisorContact = {
  id: string
  type: InsuranceContactType
  name: string
  company?: string
  phone?: string
  email?: string
  notes?: string
}

export type SavedGlobalBeneficiary = GlobalBeneficiaryInput & { id: string }

export function filterAdvisorContacts(
  contacts: SavedAdvisorContact[]
): SavedAdvisorContact[] {
  return contacts.filter((contact) => contact.type === 'agent')
}

export function contactToAgentFields(
  contact: SavedAdvisorContact
): PolicyAgentFieldsValues {
  return {
    agentName: contact.name,
    agentPhone: contact.phone ?? '',
    agentEmail: contact.email ?? '',
  }
}

export function formatGlobalBeneficiaryNotes(beneficiary: {
  idType: BeneficiaryIdType
  idNumber: string
  relationship: string
}): string {
  const idLabel = beneficiary.idType.toUpperCase()
  return `${beneficiary.relationship} · ${idLabel}: ${beneficiary.idNumber}`
}

export function globalBeneficiaryToManualRow(
  beneficiary: SavedGlobalBeneficiary
): ManualBeneficiaryRow {
  return {
    name: beneficiary.name,
    pct: beneficiary.pct ?? 0,
    observations: formatGlobalBeneficiaryNotes(beneficiary),
  }
}

export function agentFieldsToContactInput(
  agent: PolicyAgentFieldsValues
): InsuranceContactInput | null {
  const name = agent.agentName.trim()
  if (!name) {
    return null
  }

  return {
    type: 'agent',
    name,
    phone: agent.agentPhone.trim() || undefined,
    email: agent.agentEmail.trim() || undefined,
  }
}

export function manualRowToGlobalBeneficiaryInput(
  row: ManualBeneficiaryRow
): GlobalBeneficiaryInput | null {
  const name = row.name.trim()
  if (!name) {
    return null
  }

  return {
    name,
    idType: 'other',
    idNumber: '—',
    relationship: row.observations?.trim() || 'Beneficiario de póliza',
    pct: row.pct,
  }
}

export function beneficiaryRowKey(row: ManualBeneficiaryRow): string {
  return row.name.trim().toLowerCase()
}

export function appendUniqueManualBeneficiaryRows<
  T extends ManualBeneficiaryRow & { key: string },
>(existing: T[], incoming: ManualBeneficiaryRow[]): T[] {
  const seen = new Set(existing.map((row) => beneficiaryRowKey(row)))
  const next = [...existing]

  for (const row of incoming) {
    const key = beneficiaryRowKey(row)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    next.push({
      ...row,
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    } as T)
  }

  return next
}

export function isAdvisorAlreadySaved(
  agent: PolicyAgentFieldsValues,
  contacts: SavedAdvisorContact[]
): boolean {
  const name = agent.agentName.trim().toLowerCase()
  const phone = agent.agentPhone.trim()
  const email = agent.agentEmail.trim().toLowerCase()

  if (!name) {
    return false
  }

  return filterAdvisorContacts(contacts).some((contact) => {
    const sameName = contact.name.trim().toLowerCase() === name
    const samePhone =
      phone.length > 0 && (contact.phone?.trim() ?? '') === phone
    const sameEmail =
      email.length > 0 && (contact.email?.trim().toLowerCase() ?? '') === email
    return sameName && (samePhone || sameEmail || (!phone && !email))
  })
}
