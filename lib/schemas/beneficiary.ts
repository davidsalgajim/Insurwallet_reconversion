import { z } from 'zod'

import {
  BeneficiaryEntrySchema,
  type BeneficiaryEntry,
} from '@/lib/schemas/policy'

/** Wizard manual: nombre, % y observaciones (fase posterior: catálogo de beneficios sugeridos). */
export const ManualBeneficiaryRowSchema = z.object({
  name: z.string().trim().min(1),
  pct: z.number().min(0).max(100),
  observations: z.string().trim().optional(),
})

export type ManualBeneficiaryRow = z.infer<typeof ManualBeneficiaryRowSchema>

export const ManualBeneficiaryRowsSchema = z.array(ManualBeneficiaryRowSchema)

export function sumBeneficiaryPct(rows: ManualBeneficiaryRow[]): number {
  return rows.reduce((total, row) => total + row.pct, 0)
}

export function isBeneficiaryPctTotalValid(
  rows: ManualBeneficiaryRow[]
): boolean {
  if (rows.length === 0) {
    return true
  }
  return sumBeneficiaryPct(rows) <= 100
}

/** Maps manual wizard rows to embedded `beneficiaryEntries` on policy create. */
export function manualBeneficiaryToEntry(
  row: ManualBeneficiaryRow
): BeneficiaryEntry {
  return BeneficiaryEntrySchema.parse({
    name: row.name,
    pct: row.pct,
    ...(row.observations ? { notes: row.observations } : {}),
  })
}

export function sanitizeManualBeneficiaryRows(
  rows: ManualBeneficiaryRow[]
): BeneficiaryEntry[] {
  return rows
    .filter((row) => row.name.trim().length > 0)
    .map((row) => manualBeneficiaryToEntry(row))
}

export function beneficiaryEntryToManualRow(
  entry: BeneficiaryEntry
): ManualBeneficiaryRow {
  return {
    name: entry.name,
    pct: entry.pct,
    observations: entry.notes,
  }
}
