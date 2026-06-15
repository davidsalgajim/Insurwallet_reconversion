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

const COVERAGE_LIKE_BENEFIT_NAME =
  /(?:^C\.?\s*\d+|cl[aá]usula\s*\d+|indemnizaci[oó]n|seguro\s+(?:accidentes|de\s+|personal)|anticipo|fianza|cobertura|muerte|invalidez|equipaje|repatriaci[oó]n|gastos\s+m[eé]dicos|cancelaci[oó]n|traslado\s+m[eé]dico|hospitalizaci[oó]n|urgencias?)/i

const ASSISTANCE_ONLY_BENEFIT_NAME =
  /^(?:gr[uú]a|plomer[ií]a|cerrajer[ií]a|electricista|asistencia\s+(?:vial|domiciliaria|hogar|legal)|servicio\s+de\s+(?:gr[uú]a|plomer[ií]a))/i

const MONEY_LIMIT_IN_TEXT = /(?:USD|US\$|COP|\$)\s*([\d][\d.,]*)/i

const EUROPEAN_THOUSANDS = /^\d{1,3}(\.\d{3})+$/
const US_THOUSANDS = /^\d{1,3}(,\d{3})+$/

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

function normalizeMoneyNumber(raw: string): number | undefined {
  const cleaned = raw.trim()
  if (!cleaned) {
    return undefined
  }

  if (EUROPEAN_THOUSANDS.test(cleaned)) {
    const parsed = Number(cleaned.replace(/\./g, ''))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }

  if (US_THOUSANDS.test(cleaned)) {
    const parsed = Number(cleaned.replace(/,/g, ''))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }

  let normalized = cleaned
  if (normalized.includes(',') && normalized.includes('.')) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }
  } else if (normalized.includes(',')) {
    const parts = normalized.split(',')
    normalized =
      parts.length === 2 && parts[1]!.length <= 2
        ? normalized.replace(',', '.')
        : normalized.replace(/,/g, '')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parseMonetaryLimitFromText(text: string): number | undefined {
  const match = MONEY_LIMIT_IN_TEXT.exec(text)
  if (!match?.[1]) {
    return undefined
  }
  return normalizeMoneyNumber(match[1])
}

function extractBenefitMonetaryAmount(entry: BenefitEntry): number | undefined {
  const direct = coerceNonNegativeNumber(
    (entry as BenefitEntry & { amount?: unknown }).amount
  )
  if (direct !== undefined) {
    return direct
  }

  for (const field of [entry.description, entry.name] as const) {
    const text = normalizeOptionalString(field)
    if (text) {
      const parsed = parseMonetaryLimitFromText(text)
      if (parsed !== undefined) {
        return parsed
      }
    }
  }

  return undefined
}

function shouldPromoteBenefitToCoverage(entry: BenefitEntry): boolean {
  const name = normalizeOptionalString(entry.name) ?? ''
  if (!name || ASSISTANCE_ONLY_BENEFIT_NAME.test(name)) {
    return false
  }

  const amount = extractBenefitMonetaryAmount(entry)
  if (amount === undefined) {
    return false
  }

  if (COVERAGE_LIKE_BENEFIT_NAME.test(name)) {
    return true
  }

  const description = normalizeOptionalString(entry.description) ?? ''
  if (MONEY_LIMIT_IN_TEXT.test(description)) {
    return true
  }

  if ((entry as BenefitEntry & { amount?: unknown }).amount !== undefined) {
    return true
  }

  return false
}

function coverageEntryKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

/** RESUMEN DE PRESTACIONES / clause rows misrouted to benefitEntries → coverageEntries. */
export function promoteBenefitRowsToCoverages<
  T extends {
    coverageEntries?: CoverageEntry[]
    benefitEntries?: BenefitEntry[]
  },
>(fields: T): T {
  const benefits = fields.benefitEntries
  if (!benefits?.length) {
    return fields
  }

  const coverages = [...(fields.coverageEntries ?? [])]
  const seen = new Set(coverages.map((row) => coverageEntryKey(row.name)))

  const remaining: BenefitEntry[] = []

  for (const entry of benefits) {
    if (!shouldPromoteBenefitToCoverage(entry)) {
      remaining.push(entry)
      continue
    }

    const name = normalizeOptionalString(entry.name)
    const amount = extractBenefitMonetaryAmount(entry)
    if (!name || amount === undefined) {
      remaining.push(entry)
      continue
    }

    const key = coverageEntryKey(name)
    if (seen.has(key)) {
      continue
    }

    coverages.push({ name, amount })
    seen.add(key)
  }

  return {
    ...fields,
    coverageEntries: coverages,
    benefitEntries: remaining,
  }
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

  const routed = promoteBenefitRowsToCoverages(sanitized)

  if (routed.coverageEntries !== undefined) {
    routed.coverageEntries = sanitizeCoverageEntriesForPersist(
      routed.coverageEntries
    )
  }
  if (routed.benefitEntries !== undefined) {
    routed.benefitEntries = sanitizeBenefitEntriesForPersist(
      routed.benefitEntries,
      routed.insurerContacts
    )
  }

  return routed
}
