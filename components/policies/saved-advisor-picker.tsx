'use client'

import { ExternalLink } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'

import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import { useSavedAdvisors } from '@/hooks/use-saved-directory'
import { Link } from '@/i18n/navigation'
import {
  contactToAgentFields,
  type SavedAdvisorContact,
} from '@/lib/policies/saved-directory'

type SavedAdvisorPickerProps = {
  onSelect: (agent: ReturnType<typeof contactToAgentFields>) => void
  disabled?: boolean
}

export function SavedAdvisorPicker({
  onSelect,
  disabled = false,
}: SavedAdvisorPickerProps) {
  const t = useTranslations('policies.savedDirectory')
  const { advisors, loading, error } = useSavedAdvisors()

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const contactId = event.target.value
    if (!contactId) {
      return
    }

    const contact = advisors.find((entry) => entry.id === contactId)
    if (!contact) {
      return
    }

    onSelect(contactToAgentFields(contact))
    event.target.value = ''
  }

  if (!loading && advisors.length === 0) {
    return (
      <div className="rounded-[var(--radius-inner)] border border-dashed border-border/70 bg-white/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">{t('noSavedAdvisors')}</p>
        <Link
          href="/settings/contacts"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
        >
          {t('manageAdvisors')}
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label htmlFor="saved-advisor-picker" className="text-sm font-medium">
        {t('pickAdvisor')}
      </label>
      <select
        id="saved-advisor-picker"
        defaultValue=""
        onChange={handleChange}
        disabled={disabled || loading || advisors.length === 0}
        className={policyFieldClassName}
      >
        <option value="" disabled>
          {loading ? t('loading') : t('pickAdvisorPlaceholder')}
        </option>
        {advisors.map((advisor: SavedAdvisorContact) => (
          <option key={advisor.id} value={advisor.id}>
            {advisor.name}
            {advisor.phone ? ` · ${advisor.phone}` : ''}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-[var(--primitive-danger)]">
          {t('loadError')}
        </p>
      ) : null}
      <Link
        href="/settings/contacts"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
      >
        {t('manageAdvisors')}
        <ExternalLink className="size-3.5" aria-hidden />
      </Link>
    </div>
  )
}
