'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import type { BeneficiaryIdType } from '@/lib/schemas/policy'

type BeneficiaryRow = {
  id: string
  name: string
  idType: BeneficiaryIdType
  idNumber: string
  relationship: string
  pct: number
}

type BeneficiariesPanelProps = {
  policyId: string
  isOwner: boolean
}

const ID_TYPES: BeneficiaryIdType[] = ['cc', 'ce', 'passport', 'nit', 'other']

const EMPTY_FORM = {
  name: '',
  idType: 'cc' as BeneficiaryIdType,
  idNumber: '',
  relationship: '',
  pct: 100,
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
        body: JSON.stringify(form),
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
                  {t(`idType.${row.idType}`)} {row.idNumber} ·{' '}
                  {row.relationship} · {row.pct}%
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
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={t('namePlaceholder')}
            className="w-full rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={form.idType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  idType: event.target.value as BeneficiaryIdType,
                }))
              }
              className="rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm"
            >
              {ID_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`idType.${type}`)}
                </option>
              ))}
            </select>
            <input
              required
              value={form.idNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  idNumber: event.target.value,
                }))
              }
              placeholder={t('idNumberPlaceholder')}
              className="rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.relationship}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  relationship: event.target.value,
                }))
              }
              placeholder={t('relationshipPlaceholder')}
              className="rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              min={0}
              max={100}
              value={form.pct}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  pct: Number(event.target.value),
                }))
              }
              placeholder={t('pctPlaceholder')}
              className="rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm"
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
