'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type {
  BenefitEntry,
  CoverageEntry,
  DeductibleEntry,
} from '@/lib/schemas/policy'
import { cn } from '@/lib/utils/cn'

import { policyFieldClassName } from './policy-form-styles'

export type CoverageRow = CoverageEntry & { key: string }
export type DeductibleRow = DeductibleEntry & { key: string }
export type BenefitRow = BenefitEntry & { key: string }

function createRowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyCoverageRow(): CoverageRow {
  return { key: createRowKey(), name: '', amount: 0 }
}

export function createEmptyDeductibleRow(): DeductibleRow {
  return {
    key: createRowKey(),
    incidentType: '',
    amount: 0,
    isPercentage: false,
  }
}

export function createEmptyBenefitRow(): BenefitRow {
  return { key: createRowKey(), name: '' }
}

type PolicyStructuredFieldsProps = {
  coverageRows: CoverageRow[]
  deductibleRows: DeductibleRow[]
  benefitRows: BenefitRow[]
  currency: string
  onCoverageChange: (rows: CoverageRow[]) => void
  onDeductibleChange: (rows: DeductibleRow[]) => void
  onBenefitChange: (rows: BenefitRow[]) => void
}

export function PolicyStructuredFields({
  coverageRows,
  deductibleRows,
  benefitRows,
  currency,
  onCoverageChange,
  onDeductibleChange,
  onBenefitChange,
}: PolicyStructuredFieldsProps) {
  const t = useTranslations('policies.structured')

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{t('coveragesTitle')}</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            onClick={() =>
              onCoverageChange([...coverageRows, createEmptyCoverageRow()])
            }
          >
            <Plus className="size-3.5" />
            {t('addCoverage')}
          </button>
        </div>
        {coverageRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('coveragesEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {coverageRows.map((row) => (
              <div
                key={row.key}
                className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"
              >
                <input
                  type="text"
                  value={row.name}
                  placeholder={t('coverageNamePlaceholder')}
                  className={policyFieldClassName}
                  onChange={(event) =>
                    onCoverageChange(
                      coverageRows.map((item) =>
                        item.key === row.key
                          ? { ...item, name: event.target.value }
                          : item
                      )
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount || ''}
                  placeholder={t('amountPlaceholder')}
                  className={policyFieldClassName}
                  onChange={(event) =>
                    onCoverageChange(
                      coverageRows.map((item) =>
                        item.key === row.key
                          ? {
                              ...item,
                              amount: Number(event.target.value) || 0,
                            }
                          : item
                      )
                    )
                  }
                />
                <button
                  type="button"
                  aria-label={t('removeRow')}
                  className="inline-flex size-11 items-center justify-center rounded-[var(--radius-inner)] border border-border text-[var(--primitive-danger)]"
                  onClick={() =>
                    onCoverageChange(
                      coverageRows.filter((item) => item.key !== row.key)
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{t('deductiblesTitle')}</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            onClick={() =>
              onDeductibleChange([
                ...deductibleRows,
                createEmptyDeductibleRow(),
              ])
            }
          >
            <Plus className="size-3.5" />
            {t('addDeductible')}
          </button>
        </div>
        {deductibleRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('deductiblesEmpty')}
          </p>
        ) : (
          <div className="space-y-3">
            {deductibleRows.map((row) => (
              <div
                key={row.key}
                className="rounded-[var(--radius-inner)] border border-border/70 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    value={row.incidentType}
                    placeholder={t('deductibleIncidentPlaceholder')}
                    className={policyFieldClassName}
                    onChange={(event) =>
                      onDeductibleChange(
                        deductibleRows.map((item) =>
                          item.key === row.key
                            ? { ...item, incidentType: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={t('removeRow')}
                    className="inline-flex size-11 items-center justify-center rounded-[var(--radius-inner)] border border-border text-[var(--primitive-danger)]"
                    onClick={() =>
                      onDeductibleChange(
                        deductibleRows.filter((item) => item.key !== row.key)
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_160px]">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount || ''}
                    placeholder={t('amountPlaceholder')}
                    className={policyFieldClassName}
                    onChange={(event) =>
                      onDeductibleChange(
                        deductibleRows.map((item) =>
                          item.key === row.key
                            ? {
                                ...item,
                                amount: Number(event.target.value) || 0,
                              }
                            : item
                        )
                      )
                    }
                  />
                  <select
                    value={row.isPercentage ? 'percent' : 'fixed'}
                    className={policyFieldClassName}
                    onChange={(event) =>
                      onDeductibleChange(
                        deductibleRows.map((item) =>
                          item.key === row.key
                            ? {
                                ...item,
                                isPercentage: event.target.value === 'percent',
                              }
                            : item
                        )
                      )
                    }
                  >
                    <option value="fixed">{currency}</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{t('benefitsTitle')}</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            onClick={() =>
              onBenefitChange([...benefitRows, createEmptyBenefitRow()])
            }
          >
            <Plus className="size-3.5" />
            {t('addBenefit')}
          </button>
        </div>
        {benefitRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('benefitsEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {benefitRows.map((row) => (
              <div
                key={row.key}
                className="rounded-[var(--radius-inner)] border border-border/70 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_100px_auto]">
                  <input
                    type="text"
                    value={row.name}
                    placeholder={t('benefitNamePlaceholder')}
                    className={policyFieldClassName}
                    onChange={(event) =>
                      onBenefitChange(
                        benefitRows.map((item) =>
                          item.key === row.key
                            ? { ...item, name: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <input
                    type="text"
                    value={row.quantity ?? ''}
                    placeholder={t('benefitQuantityPlaceholder')}
                    className={policyFieldClassName}
                    onChange={(event) =>
                      onBenefitChange(
                        benefitRows.map((item) =>
                          item.key === row.key
                            ? { ...item, quantity: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={t('removeRow')}
                    className="inline-flex size-11 items-center justify-center rounded-[var(--radius-inner)] border border-border text-[var(--primitive-danger)]"
                    onClick={() =>
                      onBenefitChange(
                        benefitRows.filter((item) => item.key !== row.key)
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={row.description ?? ''}
                  placeholder={t('benefitDescriptionPlaceholder')}
                  className={cn(
                    policyFieldClassName,
                    'mt-2 min-h-[72px] resize-y py-3'
                  )}
                  onChange={(event) =>
                    onBenefitChange(
                      benefitRows.map((item) =>
                        item.key === row.key
                          ? { ...item, description: event.target.value }
                          : item
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export function stripStructuredRows<T extends { key: string }>(
  rows: T[]
): Array<Omit<T, 'key'>> {
  return rows.map(
    (row) =>
      Object.fromEntries(
        Object.entries(row).filter(([entryKey]) => entryKey !== 'key')
      ) as Omit<T, 'key'>
  )
}

export function sanitizeCoverageRows(rows: CoverageRow[]): CoverageEntry[] {
  return stripStructuredRows(rows).filter((row) => row.name.trim().length > 0)
}

export function sanitizeDeductibleRows(
  rows: DeductibleRow[]
): DeductibleEntry[] {
  return stripStructuredRows(rows).filter(
    (row) => row.incidentType.trim().length > 0
  )
}

export function sanitizeBenefitRows(rows: BenefitRow[]): BenefitEntry[] {
  return stripStructuredRows(rows)
    .filter((row) => row.name.trim().length > 0)
    .map((row) => ({
      name: row.name.trim(),
      description: row.description?.trim() || undefined,
      category: row.category?.trim() || undefined,
      contactInfo: row.contactInfo?.trim() || undefined,
      quantity: row.quantity?.trim() || undefined,
    }))
}
