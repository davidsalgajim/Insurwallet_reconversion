'use client'

import { FormEvent, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { AppTopbar } from '@/components/layout/app-topbar'
import {
  PolicyBasicFields,
  policyDocumentToFormValues,
  type PolicyBasicFieldsValues,
} from '@/components/policies/policy-basic-fields'
import { BenefitsCatalogSuggestions } from '@/components/policies/benefits-catalog-suggestions'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import type { PolicyDocument } from '@/lib/firebase/policies'

type PolicyEditFormProps = {
  policy: PolicyDocument
}

function PolicyEditForm({ policy }: PolicyEditFormProps) {
  const router = useRouter()
  const t = useTranslations('policies')
  const ta = useTranslations('common.actions')
  const { user, loading: authLoading } = useAuth()
  const { currency: preferredCurrency } = useUserPreferences()
  const [values, setValues] = useState<PolicyBasicFieldsValues>(() =>
    policyDocumentToFormValues(policy)
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleChange<K extends keyof PolicyBasicFieldsValues>(
    field: K,
    value: PolicyBasicFieldsValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (!user) {
      setSubmitError(t('errors.signInToEdit'))
      return
    }

    setSubmitting(true)

    try {
      const [{ db }, { updatePolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      await updatePolicy(
        db,
        policy.id,
        {
          insurerName: values.insurerName.trim(),
          policyNumber: values.policyNumber.trim(),
          policyType: values.policyType,
          holderName: values.holderName.trim(),
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
        },
        user.uid
      )

      router.push(`/policies/${policy.id}`)
    } catch {
      setSubmitError(t('errors.updateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-6 p-6">
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

      {submitError ? (
        <p className="text-sm text-[var(--primitive-danger)]">{submitError}</p>
      ) : null}

      {!authLoading && !user ? (
        <p className="text-sm text-muted-foreground">
          {t('errors.signInToSaveChanges')}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          className="rounded-[var(--radius-pill)]"
          onClick={() => router.push(`/policies/${policy.id}`)}
          disabled={submitting}
        >
          {ta('cancel')}
        </Button>
        <Button
          type="submit"
          variant="ink"
          className="rounded-[var(--radius-pill)]"
          disabled={submitting || authLoading || !user}
        >
          {submitting ? ta('saving') : ta('save')}
        </Button>
      </div>
    </form>
  )
}

type PolicyEditViewProps = {
  policy: PolicyDocument | null
  loading: boolean
  error: string | null
}

export function PolicyEditView({
  policy,
  loading,
  error,
}: PolicyEditViewProps) {
  const t = useTranslations('policies')

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href={policy ? `/policies/${policy.id}` : '/policies'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          {t('edit.backToDetail')}
        </Link>
      </div>

      <AppTopbar
        title={t('edit.title')}
        subtitle={
          policy
            ? `${policy.insurerName} · ${policy.policyNumber}`
            : t('edit.subtitleFallback')
        }
      />

      {loading ? (
        <div className="glass-panel h-96 animate-pulse bg-white/50" />
      ) : null}

      {!loading && error ? (
        <div className="glass-panel px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--primitive-danger)]">
            {error}
          </p>
          <Button
            asChild
            variant="secondary"
            className="mt-4 rounded-[var(--radius-pill)]"
          >
            <Link href="/policies">{t('detail.goToList')}</Link>
          </Button>
        </div>
      ) : null}

      {!loading && policy ? (
        <PolicyEditForm key={policy.id} policy={policy} />
      ) : null}
    </div>
  )
}
