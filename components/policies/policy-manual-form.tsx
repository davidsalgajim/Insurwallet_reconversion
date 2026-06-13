'use client'

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import {
  PolicyAgentFields,
  type PolicyAgentFieldsValues,
} from '@/components/policies/policy-agent-fields'
import {
  PolicyBasicFields,
  type PolicyBasicFieldsValues,
} from '@/components/policies/policy-basic-fields'
import { BenefitsCatalogSuggestions } from '@/components/policies/benefits-catalog-suggestions'
import {
  PolicyStructuredFields,
  createEmptyBenefitRow,
  createEmptyCoverageRow,
  createEmptyDeductibleRow,
  sanitizeBenefitRows,
  sanitizeCoverageRows,
  sanitizeDeductibleRows,
  type BenefitRow,
  type CoverageRow,
  type DeductibleRow,
} from '@/components/policies/policy-structured-fields'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import type { CreatePolicyInput } from '@/lib/firebase/policies'
import { cn } from '@/lib/utils/cn'

import { policyFieldClassName } from './policy-form-styles'

function defaultBasicValues(currency: string): PolicyBasicFieldsValues {
  return {
    insurerName: '',
    policyNumber: '',
    policyType: 'other',
    holderName: '',
    startDate: '',
    endDate: '',
    hasNoExpiration: false,
    premium: '',
    currency,
    paymentFrequency: 'annual',
    coverages: '',
    beneficiaries: '',
    exclusions: '',
    waitingPeriods: '',
    notes: '',
  }
}

function defaultAgentValues(): PolicyAgentFieldsValues {
  return {
    agentName: '',
    agentPhone: '',
    agentEmail: '',
  }
}

function buildCreateInput(
  values: PolicyBasicFieldsValues,
  agent: PolicyAgentFieldsValues,
  coverageRows: CoverageRow[],
  deductibleRows: DeductibleRow[],
  benefitRows: BenefitRow[],
  ownerUid: string
): CreatePolicyInput {
  return {
    ownerUid,
    insurerName: values.insurerName.trim(),
    policyNumber: values.policyNumber.trim(),
    policyType: values.policyType,
    holderName: values.holderName.trim() || values.insurerName.trim(),
    startDate: new Date(values.startDate),
    endDate: values.hasNoExpiration
      ? new Date(values.startDate)
      : new Date(values.endDate),
    hasNoExpiration: values.hasNoExpiration,
    premium: values.premium ? Number(values.premium) : 0,
    currency: values.currency.trim() || 'COP',
    paymentFrequency: values.paymentFrequency,
    coverages: values.coverages.trim() || undefined,
    beneficiaries: values.beneficiaries.trim() || undefined,
    exclusions: values.exclusions.trim() || undefined,
    waitingPeriods: values.waitingPeriods.trim() || undefined,
    notes: values.notes.trim() || undefined,
    agent: {
      name: agent.agentName.trim() || undefined,
      phone: agent.agentPhone.trim() || undefined,
      email: agent.agentEmail.trim() || undefined,
    },
    coverageEntries: sanitizeCoverageRows(coverageRows),
    deductibleEntries: sanitizeDeductibleRows(deductibleRows),
    benefitEntries: sanitizeBenefitRows(benefitRows),
  }
}

export function PolicyManualForm() {
  const router = useRouter()
  const t = useTranslations('policies')
  const ta = useTranslations('common.actions')
  const { user, loading: authLoading } = useAuth()
  const { currency: preferredCurrency } = useUserPreferences()
  const [values, setValues] = useState<PolicyBasicFieldsValues>(() =>
    defaultBasicValues(preferredCurrency)
  )
  const [agent, setAgent] = useState(defaultAgentValues)
  const [coverageRows, setCoverageRows] = useState<CoverageRow[]>([])
  const [deductibleRows, setDeductibleRows] = useState<DeductibleRow[]>([])
  const [benefitRows, setBenefitRows] = useState<BenefitRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange<K extends keyof PolicyBasicFieldsValues>(
    field: K,
    value: PolicyBasicFieldsValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleAgentChange<K extends keyof PolicyAgentFieldsValues>(
    field: K,
    value: PolicyAgentFieldsValues[K]
  ) {
    setAgent((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!user) {
      setError(t('errors.signInToSave'))
      return
    }

    if (
      !values.hasNoExpiration &&
      values.endDate &&
      values.startDate &&
      values.endDate < values.startDate
    ) {
      setError(t('manual.dateError'))
      return
    }

    setSubmitting(true)

    try {
      const [{ db }, { createPolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      await createPolicy(
        db,
        buildCreateInput(
          values,
          agent,
          coverageRows,
          deductibleRows,
          benefitRows,
          user.uid
        )
      )
      router.push('/policies')
    } catch {
      setError(t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-8 p-6">
      <PolicyBasicFields
        values={values}
        onChange={handleChange}
        showExtendedFields
        defaultCurrency={preferredCurrency}
      />

      <BenefitsCatalogSuggestions
        policyType={values.policyType}
        coveragesText={values.coverages}
        onAppend={(benefitLabel) => {
          handleChange(
            'coverages',
            values.coverages.trim()
              ? `${values.coverages.trim()}\n• ${benefitLabel}`
              : `• ${benefitLabel}`
          )
        }}
      />

      <div className="space-y-2">
        <label htmlFor="beneficiaries" className="text-sm font-medium">
          {t('fields.beneficiariesNotes')}
        </label>
        <textarea
          id="beneficiaries"
          name="beneficiaries"
          rows={3}
          value={values.beneficiaries}
          onChange={(event) =>
            handleChange('beneficiaries', event.target.value)
          }
          placeholder={t('fields.beneficiariesNotesPlaceholder')}
          className={cn(policyFieldClassName, 'min-h-[88px] resize-y py-3')}
        />
      </div>

      <PolicyStructuredFields
        coverageRows={coverageRows}
        deductibleRows={deductibleRows}
        benefitRows={benefitRows}
        currency={values.currency || preferredCurrency}
        onCoverageChange={setCoverageRows}
        onDeductibleChange={setDeductibleRows}
        onBenefitChange={setBenefitRows}
      />

      <PolicyAgentFields values={agent} onChange={handleAgentChange} />

      {error ? (
        <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
      ) : null}

      {!authLoading && !user ? (
        <p className="text-sm text-muted-foreground">
          {t('manual.signInHint')}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          className="rounded-[var(--radius-pill)]"
          onClick={() => router.push('/policies/new')}
          disabled={submitting}
        >
          {ta('back')}
        </Button>
        <Button
          type="submit"
          variant="ink"
          className="rounded-[var(--radius-pill)]"
          disabled={submitting || authLoading || !user}
        >
          {submitting ? ta('saving') : ta('saveAndContinue')}
        </Button>
      </div>
    </form>
  )
}

export {
  createEmptyBenefitRow,
  createEmptyCoverageRow,
  createEmptyDeductibleRow,
}
