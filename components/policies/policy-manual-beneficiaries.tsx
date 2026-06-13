'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { BeneficiaryPctField } from '@/components/policies/beneficiary-pct-field'
import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import type { ManualBeneficiaryRow } from '@/lib/schemas/beneficiary'
import {
  isBeneficiaryPctTotalValid,
  sumBeneficiaryPct,
} from '@/lib/schemas/beneficiary'
export type ManualBeneficiaryFormRow = ManualBeneficiaryRow & { key: string }

function createRowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyManualBeneficiaryRow(): ManualBeneficiaryFormRow {
  return {
    key: createRowKey(),
    name: '',
    pct: 0,
    observations: '',
  }
}

type PolicyManualBeneficiariesProps = {
  rows: ManualBeneficiaryFormRow[]
  onChange: (rows: ManualBeneficiaryFormRow[]) => void
}

export function PolicyManualBeneficiaries({
  rows,
  onChange,
}: PolicyManualBeneficiariesProps) {
  const t = useTranslations('policies.manual')
  const tb = useTranslations('policies.beneficiaries')
  const pctTotal = sumBeneficiaryPct(rows)
  const pctValid = isBeneficiaryPctTotalValid(rows)

  function updateRow(
    key: string,
    patch: Partial<Omit<ManualBeneficiaryFormRow, 'key'>>
  ) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeRow(key: string) {
    onChange(rows.filter((row) => row.key !== key))
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t('beneficiariesTitle')}</h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          onClick={() => onChange([...rows, createEmptyManualBeneficiaryRow()])}
        >
          <Plus className="size-3.5" />
          {t('addBeneficiary')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('beneficiariesEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="space-y-3 rounded-[var(--radius-inner)] border border-border/60 bg-white/50 p-4"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <label
                    htmlFor={`${row.key}-name`}
                    className="text-sm font-medium"
                  >
                    {t('beneficiaryName')}
                  </label>
                  <input
                    id={`${row.key}-name`}
                    type="text"
                    value={row.name}
                    onChange={(event) =>
                      updateRow(row.key, { name: event.target.value })
                    }
                    placeholder={t('beneficiaryNamePlaceholder')}
                    className={policyFieldClassName}
                  />
                </div>
                <button
                  type="button"
                  className="mt-7 rounded-[var(--radius-inner)] border border-border/60 p-2 text-[var(--primitive-danger)]"
                  onClick={() => removeRow(row.key)}
                  aria-label={tb('delete')}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <BeneficiaryPctField
                  id={`${row.key}-pct`}
                  value={row.pct}
                  onChange={(pct) => updateRow(row.key, { pct })}
                  label={t('beneficiaryPctLabel')}
                  placeholder={t('beneficiaryPctPlaceholder')}
                  helperText={t('beneficiaryPctHelper')}
                  ariaLabel={t('beneficiaryPctAriaLabel')}
                />
                <div className="space-y-2">
                  <label
                    htmlFor={`${row.key}-observations`}
                    className="text-sm font-medium"
                  >
                    {t('beneficiaryObservations')}
                  </label>
                  <input
                    id={`${row.key}-observations`}
                    type="text"
                    value={row.observations ?? ''}
                    onChange={(event) =>
                      updateRow(row.key, { observations: event.target.value })
                    }
                    placeholder={t('beneficiaryObservationsPlaceholder')}
                    className={policyFieldClassName}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t('beneficiaryPctTotal', { pct: pctTotal })}
          </p>
          {!pctValid ? (
            <p className="text-xs text-[var(--primitive-warning)]">
              {t('beneficiaryPctWarning')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
