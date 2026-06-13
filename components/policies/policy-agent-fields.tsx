'use client'

import { useTranslations } from 'next-intl'

import { policyFieldClassName } from './policy-form-styles'

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
}

export function PolicyAgentFields({
  values,
  onChange,
}: PolicyAgentFieldsProps) {
  const t = useTranslations('policies.agent')

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
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
          />
        </div>
      </div>
    </section>
  )
}
