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
import {
  PolicyManualBeneficiaries,
  createEmptyManualBeneficiaryRow,
  type ManualBeneficiaryFormRow,
} from '@/components/policies/policy-manual-beneficiaries'
import {
  PolicyStructuredFields,
  createEmptyBenefitRow,
  createEmptyCoverageRow,
  createEmptyDeductibleRow,
  type BenefitRow,
  type CoverageRow,
  type DeductibleRow,
} from '@/components/policies/policy-structured-fields'
import {
  PdfUploadZone,
  type SelectedUploadFile,
} from '@/components/policies/pdf-upload-zone'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { buildCreateInputFromForm } from '@/lib/policies/form-input'
import { uploadDocumentsToPolicy } from '@/lib/policies/document-upload'

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
  const [beneficiaryRows, setBeneficiaryRows] = useState<
    ManualBeneficiaryFormRow[]
  >([])
  const [saveAgentToContacts, setSaveAgentToContacts] = useState(false)
  const [beneficiarySaveFlags, setBeneficiarySaveFlags] = useState<
    Record<string, boolean>
  >({})
  const [supportingFiles, setSupportingFiles] = useState<SelectedUploadFile[]>(
    []
  )
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

      const input = buildCreateInputFromForm(
        values,
        agent,
        coverageRows,
        deductibleRows,
        benefitRows,
        beneficiaryRows,
        user.uid
      )

      const created = await createPolicy(db, input)

      if (input.beneficiaryEntries && input.beneficiaryEntries.length > 0) {
        const { syncPolicyBeneficiaries } =
          await import('@/lib/policies/form-input')
        await syncPolicyBeneficiaries(created.id, input.beneficiaryEntries)
      }

      if (supportingFiles.length > 0) {
        const [{ storage }] = await Promise.all([
          import('@/lib/firebase/client'),
        ])

        const uploadResult = await uploadDocumentsToPolicy({
          db,
          storage,
          ownerUid: user.uid,
          policyId: created.id,
          documents: supportingFiles.map((item) => ({
            localId: item.id,
            file: item.file,
            documentRole: item.documentRole,
          })),
        })

        if (!uploadResult.ok) {
          setError(t('manual.supportingUploadFailed'))
          router.push(`/policies/${created.id}`)
          return
        }
      }

      try {
        const { saveAdvisorToContacts, saveMarkedBeneficiaries } =
          await import('@/lib/policies/save-to-directory')
        if (saveAgentToContacts) {
          await saveAdvisorToContacts(agent)
        }
        await saveMarkedBeneficiaries(
          beneficiaryRows.map((row) => ({
            row,
            save: beneficiarySaveFlags[row.key] ?? false,
          }))
        )
      } catch {
        // Policy saved; directory sync is best-effort.
      }

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

      {/* Beneficios sugeridos programados para fase posterior — ver policy-edit-view */}
      <PolicyManualBeneficiaries
        rows={beneficiaryRows}
        onChange={setBeneficiaryRows}
        saveFlags={beneficiarySaveFlags}
        onSaveFlagChange={(key, value) =>
          setBeneficiarySaveFlags((current) => ({ ...current, [key]: value }))
        }
        disabled={submitting}
      />

      <PolicyStructuredFields
        coverageRows={coverageRows}
        deductibleRows={deductibleRows}
        benefitRows={benefitRows}
        currency={values.currency || preferredCurrency}
        onCoverageChange={setCoverageRows}
        onDeductibleChange={setDeductibleRows}
        onBenefitChange={setBenefitRows}
      />

      <PolicyAgentFields
        values={agent}
        onChange={handleAgentChange}
        saveToContacts={saveAgentToContacts}
        onSaveToContactsChange={setSaveAgentToContacts}
        disabled={submitting}
      />

      <section className="space-y-3 border-t border-border/60 pt-6">
        <div>
          <h3 className="text-sm font-semibold">
            {t('manual.supportingTitle')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('manual.supportingDesc')}
          </p>
        </div>
        <PdfUploadZone
          disabled={submitting}
          selectedFiles={supportingFiles}
          onFilesChange={setSupportingFiles}
          showRoleSelector
        />
      </section>

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
  createEmptyManualBeneficiaryRow,
  createEmptyBenefitRow,
  createEmptyCoverageRow,
  createEmptyDeductibleRow,
}
