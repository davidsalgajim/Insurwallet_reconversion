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
  pct?: number
}

const ID_TYPES: BeneficiaryIdType[] = ['cc', 'ce', 'passport', 'nit', 'other']

const EMPTY_FORM = {
  name: '',
  idType: 'cc' as BeneficiaryIdType,
  idNumber: '',
  relationship: '',
  pct: 100,
}

export function GlobalBeneficiariesPanel() {
  const t = useTranslations('settings.contacts')
  const tb = useTranslations('policies.beneficiaries')
  const [rows, setRows] = useState<BeneficiaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const loadBeneficiaries = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (options?.showLoading) {
        setLoading(true)
      }
      setError(null)
      try {
        const response = await fetch('/api/user/beneficiaries')
        if (!response.ok) {
          throw new Error('load failed')
        }
        const payload = (await response.json()) as {
          beneficiaries: BeneficiaryRow[]
        }
        setRows(payload.beneficiaries)
      } catch {
        setError(tb('loadError'))
      } finally {
        setLoading(false)
      }
    },
    [tb]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBeneficiaries()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBeneficiaries])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        throw new Error('create failed')
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadBeneficiaries({ showLoading: true })
    } catch {
      setError(tb('saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(beneficiaryId: string) {
    setError(null)
    try {
      const response = await fetch(`/api/user/beneficiaries/${beneficiaryId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('delete failed')
      }
      await loadBeneficiaries({ showLoading: true })
    } catch {
      setError(tb('deleteError'))
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t('beneficiariesTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('beneficiariesHint')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-[var(--radius-pill)]"
          onClick={() => setShowForm((open) => !open)}
        >
          <Plus className="size-4" />
          {tb('add')}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass-panel space-y-3 p-4">
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={tb('namePlaceholder')}
            className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
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
              className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
            >
              {ID_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tb(`idTypes.${type}`)}
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
              placeholder={tb('idNumberPlaceholder')}
              className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm font-mono"
            />
          </div>
          <input
            required
            value={form.relationship}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                relationship: event.target.value,
              }))
            }
            placeholder={tb('relationshipPlaceholder')}
            className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
          />
          <Button type="submit" disabled={submitting} size="sm">
            {submitting ? tb('saving') : tb('save')}
          </Button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('emptyBeneficiaries')}
        </p>
      ) : (
        <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.relationship} · {tb(`idTypes.${row.idType}`)}{' '}
                  {row.idNumber}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-9 shrink-0 p-0"
                onClick={() => void handleDelete(row.id)}
                aria-label={tb('delete')}
              >
                <Trash2 className="size-4 text-[var(--primitive-coral)]" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
