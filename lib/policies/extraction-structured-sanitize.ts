import { z } from 'zod'

import { normalizeExtractedAgentEmail } from '@/lib/policies/agent-placeholders'
import type {
  BenefitEntry,
  BeneficiaryEntry,
  CoverageEntry,
  DeductibleEntry,
  InsurerContactLine,
} from '@/lib/schemas/policy'
import { normalizeOptionalString } from '@/lib/utils/normalize-optional-string'

const CONTACT_LIKE_BENEFIT_NAME =
  /^(?:asistencia(?:\s*[—–-]\s*.+)?|whatsapp(?:\s+de\s+asistencia)?|am[eé]rica\s+latina|latinoam[eé]rica|norteam[eé]rica|asia|europa|colombia|m[eé]xico|brasil|central(?:es)?(?:\s+de\s+asistencia)?|l[ií]nea\s+(?:nacional|internacional|de\s+atenci[oó]n)|servicio\s+al\s+cliente|sac)\s*$/i

function phoneDigits(value: string | undefined | null): string {
  return (value ?? '').replace(/\D/g, '')
}

function collectInsurerContactPhones(
  contacts: InsurerContactLine[] | undefined
): Set<string> {
  const phones = new Set<string>()
  for (const contact of contacts ?? []) {
    const digits = phoneDigits(contact.phone?.split(' ext ')[0])
    if (digits) {
      phones.add(digits)
    }
  }
  return phones
}

function isContactLikeBenefitEntry(
  entry: BenefitEntry,
  insurerPhones: Set<string>
): boolean {
  const name = normalizeOptionalString(entry.name) ?? ''
  if (CONTACT_LIKE_BENEFIT_NAME.test(name)) {
    return true
  }
  if (/^asistencia\s*[—–-]/i.test(name)) {
    return true
  }

  const contactInfo = normalizeOptionalString(entry.contactInfo)
  if (contactInfo) {
    const digits = phoneDigits(contactInfo.split(' ext ')[0])
    if (digits && insurerPhones.has(digits)) {
      return true
    }
  }

  return false
}

export function dropContactLikeBenefitEntries(
  entries: BenefitEntry[],
  insurerContacts?: InsurerContactLine[]
): BenefitEntry[] {
  const insurerPhones = collectInsurerContactPhones(insurerContacts)
  return entries.filter(
    (entry) => !isContactLikeBenefitEntry(entry, insurerPhones)
  )
}

function coerceNonNegativeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 0 ? value : undefined
  }
  if (typeof value === 'string') {
    const normalized = normalizeOptionalString(value)
    if (!normalized) {
      return undefined
    }
    const parsed = Number(normalized.replace(/,/g, ''))
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }
  return undefined
}

function coercePct(value: unknown): number | undefined {
  const amount = coerceNonNegativeNumber(value)
  if (amount === undefined) {
    return undefined
  }
  if (amount > 100) {
    return 100
  }
  return amount
}

function normalizeBenefitContactInfo(
  value: string | undefined | null
): string | undefined {
  const trimmed = normalizeOptionalString(value)
  if (!trimmed) {
    return undefined
  }

  if (trimmed.includes('@')) {
    const email = normalizeExtractedAgentEmail(trimmed)
    return email || undefined
  }

  return trimmed
}

/** eventsPerYear / annual limits live in `quantity` as a string in the schema. */
function normalizeBenefitQuantity(
  value: string | number | undefined | null
): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 0 && Number.isInteger(value)) {
      return String(value)
    }
    return undefined
  }

  const trimmed = normalizeOptionalString(
    typeof value === 'string' ? value : undefined
  )
  if (!trimmed) {
    return undefined
  }

  const parsed = Number(trimmed.replace(/,/g, ''))
  if (Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
    return String(parsed)
  }

  return trimmed
}

export function sanitizeBeneficiaryEntriesForPersist(
  entries: BeneficiaryEntry[]
): BeneficiaryEntry[] {
  const sanitized: BeneficiaryEntry[] = []

  for (const entry of entries) {
    const name = normalizeOptionalString(entry.name)
    if (!name) {
      continue
    }

    const pct = coercePct(entry.pct)
    if (pct === undefined) {
      continue
    }

    const notes = normalizeOptionalString(entry.notes)
    sanitized.push({
      name,
      pct,
      ...(notes ? { notes } : {}),
    })
  }

  return sanitized
}

export function sanitizeCoverageEntriesForPersist(
  entries: CoverageEntry[]
): CoverageEntry[] {
  const sanitized: CoverageEntry[] = []

  for (const entry of entries) {
    const name = normalizeOptionalString(entry.name)
    if (!name) {
      continue
    }

    const amount = coerceNonNegativeNumber(entry.amount)
    if (amount === undefined) {
      continue
    }

    sanitized.push({ name, amount })
  }

  return sanitized
}

export function sanitizeDeductibleEntriesForPersist(
  entries: DeductibleEntry[]
): DeductibleEntry[] {
  const sanitized: DeductibleEntry[] = []

  for (const entry of entries) {
    const incidentType = normalizeOptionalString(entry.incidentType)
    if (!incidentType) {
      continue
    }

    const amount = coerceNonNegativeNumber(entry.amount)
    if (amount === undefined) {
      continue
    }

    sanitized.push({
      incidentType,
      amount,
      isPercentage: z.boolean().safeParse(entry.isPercentage).success
        ? entry.isPercentage
        : false,
    })
  }

  return sanitized
}

export function sanitizeBenefitEntriesForPersist(
  entries: BenefitEntry[],
  insurerContacts?: InsurerContactLine[]
): BenefitEntry[] {
  const sanitized: BenefitEntry[] = []

  for (const entry of entries) {
    const name = normalizeOptionalString(entry.name)
    if (!name) {
      continue
    }

    const description = normalizeOptionalString(entry.description)
    const category = normalizeOptionalString(entry.category)
    const contactInfo = normalizeBenefitContactInfo(entry.contactInfo)
    const quantity = normalizeBenefitQuantity(entry.quantity)

    sanitized.push({
      name,
      ...(description ? { description } : {}),
      ...(category ? { category } : {}),
      ...(contactInfo ? { contactInfo } : {}),
      ...(quantity ? { quantity } : {}),
    })
  }

  return dropContactLikeBenefitEntries(sanitized, insurerContacts)
}

export function sanitizeStructuredExtractionArraysForPersist<
  T extends {
    beneficiaryEntries?: BeneficiaryEntry[]
    coverageEntries?: CoverageEntry[]
    deductibleEntries?: DeductibleEntry[]
    benefitEntries?: BenefitEntry[]
    insurerContacts?: InsurerContactLine[]
  },
>(fields: T): T {
  const sanitized = { ...fields }

  if (fields.beneficiaryEntries !== undefined) {
    sanitized.beneficiaryEntries = sanitizeBeneficiaryEntriesForPersist(
      fields.beneficiaryEntries
    )
  }
  if (fields.coverageEntries !== undefined) {
    sanitized.coverageEntries = sanitizeCoverageEntriesForPersist(
      fields.coverageEntries
    )
  }
  if (fields.deductibleEntries !== undefined) {
    sanitized.deductibleEntries = sanitizeDeductibleEntriesForPersist(
      fields.deductibleEntries
    )
  }
  if (fields.benefitEntries !== undefined) {
    sanitized.benefitEntries = sanitizeBenefitEntriesForPersist(
      fields.benefitEntries,
      fields.insurerContacts
    )
  }

  return sanitized
}
