'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import type { InsuranceContactType } from '@/lib/schemas/user-contacts'

type ContactRow = {
  id: string
  type: InsuranceContactType
  name: string
  company?: string
  phone?: string
  email?: string
  notes?: string
}

const CONTACT_TYPES: InsuranceContactType[] = [
  'agent',
  'insurer',
  'broker',
  'emergency',
  'other',
]

const EMPTY_FORM = {
  type: 'agent' as InsuranceContactType,
  name: '',
  company: '',
  phone: '',
  email: '',
  notes: '',
}

export function GlobalContactsPanel() {
  const t = useTranslations('settings.contacts')
  const [rows, setRows] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const loadContacts = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (options?.showLoading) {
        setLoading(true)
      }
      setError(null)
      try {
        const response = await fetch('/api/user/contacts')
        if (!response.ok) {
          throw new Error('load failed')
        }
        const payload = (await response.json()) as { contacts: ContactRow[] }
        setRows(payload.contacts)
      } catch {
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    },
    [t]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContacts()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadContacts])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company: form.company || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (!response.ok) {
        throw new Error('create failed')
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadContacts({ showLoading: true })
    } catch {
      setError(t('saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(contactId: string) {
    setError(null)
    try {
      const response = await fetch(`/api/user/contacts/${contactId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('delete failed')
      }
      await loadContacts({ showLoading: true })
    } catch {
      setError(t('deleteError'))
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t('insuranceTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('insuranceHint')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-[var(--radius-pill)]"
          onClick={() => setShowForm((open) => !open)}
        >
          <Plus className="size-4" />
          {t('addContact')}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass-panel space-y-3 p-4">
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as InsuranceContactType,
              }))
            }
            className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
          >
            {CONTACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={t('namePlaceholder')}
            className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder={t('phonePlaceholder')}
              className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder={t('emailPlaceholder')}
              className="h-10 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
            />
          </div>
          <Button type="submit" disabled={submitting} size="sm">
            {submitting ? t('saving') : t('save')}
          </Button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('emptyContacts')}</p>
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
                  {t(`types.${row.type}`)}
                  {row.phone ? ` · ${row.phone}` : ''}
                  {row.email ? ` · ${row.email}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-9 shrink-0 p-0"
                onClick={() => void handleDelete(row.id)}
                aria-label={t('delete')}
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
