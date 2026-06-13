'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { BeneficiaryPctField } from '@/components/policies/beneficiary-pct-field'
import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import { Button } from '@/components/ui/button'

type BeneficiaryRow = {
  id: string
  name: string
  pct: number
  notes?: string
}

type BeneficiariesPanelProps = {
  policyId: string
  isOwner: boolean
}

const EMPTY_FORM = {
  name: '',
  pct: 0,
  notes: '',
}

export function BeneficiariesPanel({
  policyId,
  isOwner,
}: BeneficiariesPanelProps) {
  const t = useTranslations('policies.beneficiaries')
  const [rows, setRows] = useState<BeneficiaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/policies/${policyId}/beneficiaries`)
      if (!response.ok) {
        throw new Error('load failed')
      }
      const payload = (await response.json()) as {
        beneficiaries: BeneficiaryRow[]
      }
      setRows(payload.beneficiaries)
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [policyId, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBeneficiaries()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBeneficiaries])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isOwner) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/policies/${policyId}/beneficiaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          pct: form.pct,
          notes: form.notes.trim() || undefined,
        }),
      })
      if (!response.ok) {
        throw new Error('create failed')
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadBeneficiaries()
    } catch {
      setError(t('saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(beneficiaryId: string) {
    if (!isOwner) {
      return
    }

    setError(null)
    try {
      const response = await fetch(
        `/api/policies/${policyId}/beneficiaries/${beneficiaryId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        throw new Error('delete failed')
      }
      await loadBeneficiaries()
    } catch {
      setError(t('deleteError'))
    }
  }

  return (
    <div className="elevated-card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <h2 className="font-semibold">{t('title')}</h2>
        {isOwner ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-[var(--radius-pill)]"
            onClick={() => setShowForm((current) => !current)}
          >
            <Plus className="size-4" strokeWidth={1.5} />
            {t('add')}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-inner)] border border-border/60 bg-white/50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.pct}%{row.notes ? ` · ${row.notes}` : ''}
                </p>
              </div>
              {isOwner ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-[var(--radius-pill)] text-[var(--primitive-danger)]"
                  onClick={() => void handleDelete(row.id)}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                  {t('delete')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {showForm && isOwner ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-3 rounded-[var(--radius-inner)] border border-border/60 bg-white/50 p-4"
        >
          <div className="space-y-2">
            <label htmlFor="beneficiary-name" className="text-sm font-medium">
              {t('nameLabel')}
            </label>
            <input
              id="beneficiary-name"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={t('namePlaceholder')}
              className={policyFieldClassName}
            />
          </div>
          <BeneficiaryPctField
            id="beneficiary-pct"
            value={form.pct}
            onChange={(pct) => setForm((current) => ({ ...current, pct }))}
            label={t('pctLabel')}
            placeholder={t('pctPlaceholder')}
            helperText={t('pctHelper')}
            ariaLabel={t('pctAriaLabel')}
          />
          <div className="space-y-2">
            <label htmlFor="beneficiary-notes" className="text-sm font-medium">
              {t('notesLabel')}
            </label>
            <textarea
              id="beneficiary-notes"
              rows={2}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder={t('notesPlaceholder')}
              className={policyFieldClassName}
            />
          </div>
          <Button
            type="submit"
            variant="ink"
            size="sm"
            className="rounded-[var(--radius-pill)]"
            disabled={submitting}
          >
            {submitting ? t('saving') : t('save')}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
