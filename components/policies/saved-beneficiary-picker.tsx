'use client'

import { ExternalLink, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import { useSavedBeneficiaries } from '@/hooks/use-saved-directory'
import { Link } from '@/i18n/navigation'
import {
  appendUniqueManualBeneficiaryRows,
  globalBeneficiaryToManualRow,
  type SavedGlobalBeneficiary,
} from '@/lib/policies/saved-directory'
import type { ManualBeneficiaryFormRow } from '@/components/policies/policy-manual-beneficiaries'

type SavedBeneficiaryPickerProps = {
  rows: ManualBeneficiaryFormRow[]
  onChange: (rows: ManualBeneficiaryFormRow[]) => void
  disabled?: boolean
}

export function SavedBeneficiaryPicker({
  rows,
  onChange,
  disabled = false,
}: SavedBeneficiaryPickerProps) {
  const t = useTranslations('policies.savedDirectory')
  const { beneficiaries, loading, error } = useSavedBeneficiaries()
  const [selectedId, setSelectedId] = useState('')

  const available = useMemo(() => {
    const existing = new Set(
      rows.map((row) => row.name.trim().toLowerCase()).filter(Boolean)
    )
    return beneficiaries.filter(
      (beneficiary) => !existing.has(beneficiary.name.trim().toLowerCase())
    )
  }, [beneficiaries, rows])

  function handleAdd() {
    if (!selectedId) {
      return
    }

    const beneficiary = beneficiaries.find((entry) => entry.id === selectedId)
    if (!beneficiary) {
      return
    }

    onChange(
      appendUniqueManualBeneficiaryRows(rows, [
        globalBeneficiaryToManualRow(beneficiary),
      ])
    )
    setSelectedId('')
  }

  if (!loading && beneficiaries.length === 0) {
    return (
      <div className="rounded-[var(--radius-inner)] border border-dashed border-border/70 bg-white/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {t('noSavedBeneficiaries')}
        </p>
        <Link
          href="/settings/contacts"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
        >
          {t('manageBeneficiaries')}
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-[var(--radius-inner)] border border-border/60 bg-white/40 p-4">
      <p className="text-sm font-medium">{t('pickBeneficiaries')}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="saved-beneficiary-picker" className="sr-only">
            {t('pickBeneficiaryPlaceholder')}
          </label>
          <select
            id="saved-beneficiary-picker"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={disabled || loading || available.length === 0}
            className={policyFieldClassName}
          >
            <option value="" disabled>
              {loading
                ? t('loading')
                : available.length === 0
                  ? t('allBeneficiariesAdded')
                  : t('pickBeneficiaryPlaceholder')}
            </option>
            {available.map((beneficiary: SavedGlobalBeneficiary) => (
              <option key={beneficiary.id} value={beneficiary.id}>
                {beneficiary.name}
                {beneficiary.pct != null ? ` · ${beneficiary.pct}%` : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-[var(--radius-pill)] border border-border/60 bg-white px-4 py-2 text-xs font-semibold text-primary disabled:opacity-50"
          onClick={handleAdd}
          disabled={disabled || !selectedId}
        >
          <Plus className="size-3.5" />
          {t('addSelectedBeneficiary')}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-[var(--primitive-danger)]">
          {t('loadError')}
        </p>
      ) : null}
      <Link
        href="/settings/contacts"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
      >
        {t('manageBeneficiaries')}
        <ExternalLink className="size-3.5" aria-hidden />
      </Link>
    </div>
  )
}
