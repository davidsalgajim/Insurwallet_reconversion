'use client'

import { Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SavedAdvisorPicker } from '@/components/policies/saved-advisor-picker'
import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import { isAdvisorAlreadySaved } from '@/lib/policies/saved-directory'
import { useSavedAdvisors } from '@/hooks/use-saved-directory'
import type { InsurerContactLine } from '@/lib/schemas/policy'

export type InsurerContactRow = InsurerContactLine & { key: string }

export type PolicyAgentFieldsValues = {
  agentName: string
  agentPhone: string
  agentEmail: string
  insurerContactRows: InsurerContactRow[]
}

type PolicyAgentFieldsProps = {
  values: PolicyAgentFieldsValues
  onChange: <K extends keyof PolicyAgentFieldsValues>(
    field: K,
    value: PolicyAgentFieldsValues[K]
  ) => void
  saveToContacts?: boolean
  onSaveToContactsChange?: (value: boolean) => void
  disabled?: boolean
}

function createContactKey(): string {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function insurerContactsToRows(
  contacts: InsurerContactLine[]
): InsurerContactRow[] {
  return contacts.map((contact, index) => ({
    key: `contact-${index}-${contact.phone ?? contact.email ?? 'line'}`,
    label: contact.label ?? '',
    phone: contact.phone ?? '',
    email: contact.email ?? '',
  }))
}

export function insurerContactRowsToLines(
  rows: InsurerContactRow[]
): InsurerContactLine[] {
  return rows
    .map((row) => {
      const label = (row.label ?? '').trim()
      const phone = (row.phone ?? '').trim()
      const email = (row.email ?? '').trim()
      return {
        ...(label ? { label } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
      }
    })
    .filter((line) => line.phone || line.email || line.label)
}

export function PolicyAgentFields({
  values,
  onChange,
  saveToContacts = false,
  onSaveToContactsChange,
  disabled = false,
}: PolicyAgentFieldsProps) {
  const t = useTranslations('policies.agent')
  const ts = useTranslations('policies.savedDirectory')
  const { advisors } = useSavedAdvisors()
  const canSave =
    values.agentName.trim().length > 0 &&
    !isAdvisorAlreadySaved(values, advisors)

  function applyAdvisor(agent: PolicyAgentFieldsValues) {
    onChange('agentName', agent.agentName)
    onChange('agentPhone', agent.agentPhone)
    onChange('agentEmail', agent.agentEmail)
    onSaveToContactsChange?.(false)
  }

  function applyContactAsPrimary(row: InsurerContactRow) {
    const phone = (row.phone ?? '').trim()
    const email = (row.email ?? '').trim()
    const label = (row.label ?? '').trim()
    if (phone) {
      onChange('agentPhone', phone)
    }
    if (email) {
      onChange('agentEmail', email)
    }
    if (!values.agentName.trim() && label) {
      onChange('agentName', label)
    }
  }

  function updateContactRow(
    key: string,
    field: keyof InsurerContactLine,
    value: string
  ) {
    onChange(
      'insurerContactRows',
      values.insurerContactRows.map((row) =>
        row.key === key ? { ...row, [field]: value } : row
      )
    )
  }

  function addContactRow() {
    onChange('insurerContactRows', [
      ...values.insurerContactRows,
      { key: createContactKey(), label: '', phone: '', email: '' },
    ])
  }

  function removeContactRow(key: string) {
    onChange(
      'insurerContactRows',
      values.insurerContactRows.filter((row) => row.key !== key)
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <SavedAdvisorPicker onSelect={applyAdvisor} disabled={disabled} />

      <div className="space-y-2">
        <label htmlFor="agentName" className="text-sm font-medium">
          {t('name')}
        </label>
        <input
          id="agentName"
          name="agentName"
          type="text"
          value={values.agentName}
          onChange={(event) => onChange('agentName', event.target.value)}
          placeholder={t('namePlaceholder')}
          className={policyFieldClassName}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="agentPhone" className="text-sm font-medium">
            {t('phone')}
          </label>
          <input
            id="agentPhone"
            name="agentPhone"
            type="tel"
            value={values.agentPhone}
            onChange={(event) => onChange('agentPhone', event.target.value)}
            placeholder={t('phonePlaceholder')}
            className={policyFieldClassName}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="agentEmail" className="text-sm font-medium">
            {t('email')}
          </label>
          <input
            id="agentEmail"
            name="agentEmail"
            type="email"
            value={values.agentEmail}
            onChange={(event) => onChange('agentEmail', event.target.value)}
            placeholder={t('emailPlaceholder')}
            className={policyFieldClassName}
            disabled={disabled}
          />
        </div>
      </div>

      {values.insurerContactRows.length > 0 ? (
        <div className="space-y-3 rounded-[var(--radius-inner)] border border-border/70 bg-white/40 p-4">
          <div>
            <h4 className="text-sm font-medium">{t('assistanceLinesTitle')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('assistanceLinesHint')}
            </p>
          </div>
          <ul className="space-y-3">
            {values.insurerContactRows.map((row) => (
              <li
                key={row.key}
                className="space-y-2 rounded-[var(--radius-inner)] border border-border/60 bg-background/80 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {(row.label ?? '').trim() ||
                      t('assistanceLineDefaultLabel')}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    onClick={() => applyContactAsPrimary(row)}
                    disabled={disabled}
                  >
                    <Phone className="size-3.5" strokeWidth={1.5} />
                    {t('useAsPrimary')}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(event) =>
                      updateContactRow(row.key, 'label', event.target.value)
                    }
                    placeholder={t('assistanceLabelPlaceholder')}
                    className={policyFieldClassName}
                    disabled={disabled}
                    aria-label={t('assistanceLabelPlaceholder')}
                  />
                  <input
                    type="tel"
                    value={row.phone}
                    onChange={(event) =>
                      updateContactRow(row.key, 'phone', event.target.value)
                    }
                    placeholder={t('phonePlaceholder')}
                    className={policyFieldClassName}
                    disabled={disabled}
                    aria-label={t('phone')}
                  />
                  <input
                    type="email"
                    value={row.email}
                    onChange={(event) =>
                      updateContactRow(row.key, 'email', event.target.value)
                    }
                    placeholder={t('emailPlaceholder')}
                    className={policyFieldClassName}
                    disabled={disabled}
                    aria-label={t('email')}
                  />
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-[var(--primitive-danger)]"
                  onClick={() => removeContactRow(row.key)}
                  disabled={disabled}
                >
                  {t('removeAssistanceLine')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        onClick={addContactRow}
        disabled={disabled}
      >
        {t('addAssistanceLine')}
      </button>

      {canSave && onSaveToContactsChange ? (
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-border"
            checked={saveToContacts}
            onChange={(event) => onSaveToContactsChange(event.target.checked)}
            disabled={disabled}
          />
          <span>{ts('saveAdvisor')}</span>
        </label>
      ) : null}
    </section>
  )
}
