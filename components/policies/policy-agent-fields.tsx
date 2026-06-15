'use client'

import { useTranslations } from 'next-intl'

import { SavedAdvisorPicker } from '@/components/policies/saved-advisor-picker'
import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import { isAdvisorAlreadySaved } from '@/lib/policies/saved-directory'
import { useSavedAdvisors } from '@/hooks/use-saved-directory'

export type PolicyAgentFieldsValues = {
  agentName: string
  agentPhone: string
  agentEmail: string
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
