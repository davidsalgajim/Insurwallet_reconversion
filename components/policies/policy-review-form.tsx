'use client'

import { FileText, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'

import {
  PolicyAgentFields,
  type PolicyAgentFieldsValues,
} from '@/components/policies/policy-agent-fields'
import {
  PolicyBasicFields,
  type PolicyBasicFieldsValues,
} from '@/components/policies/policy-basic-fields'
import { PolicyPdfViewer } from '@/components/policies/policy-pdf-viewer'
import {
  PolicyManualBeneficiaries,
  type ManualBeneficiaryFormRow,
} from '@/components/policies/policy-manual-beneficiaries'
import {
  PolicyStructuredFields,
  type BenefitRow,
  type CoverageRow,
  type DeductibleRow,
} from '@/components/policies/policy-structured-fields'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import type { PolicyDocument } from '@/lib/firebase/policies'
import {
  buildCreateInputFromForm,
  syncPolicyBeneficiaries,
} from '@/lib/policies/form-input'
import {
  mergeAgentFromExtraction,
  mergeBasicValuesFromExtraction,
  mergeStructuredRowsFromExtraction,
} from '@/lib/policies/review-form-state'
import { computePolicyExtractionDiff } from '@/lib/policies/policy-diff'
import type { PolicyExtraction } from '@/lib/schemas/extraction'
import { PolicyUpdatePrompt } from '@/components/policies/policy-update-prompt'

type PolicyReviewFormProps = {
  policy: PolicyDocument
  userUid: string
  storagePath?: string
  fileName?: string
  extraction?: PolicyExtraction
}

export function PolicyReviewForm({
  policy,
  userUid,
  storagePath,
  fileName,
  extraction,
}: PolicyReviewFormProps) {
  const t = useTranslations('policies.review')
  const ta = useTranslations('common.actions')
  const router = useRouter()

  const structured = mergeStructuredRowsFromExtraction(policy, extraction)
  const [values, setValues] = useState<PolicyBasicFieldsValues>(() =>
    mergeBasicValuesFromExtraction(policy, extraction)
  )
  const [agent, setAgent] = useState<PolicyAgentFieldsValues>(() =>
    mergeAgentFromExtraction(policy, extraction)
  )
  const [coverageRows, setCoverageRows] = useState<CoverageRow[]>(
    structured.coverageRows
  )
  const [deductibleRows, setDeductibleRows] = useState<DeductibleRow[]>(
    structured.deductibleRows
  )
  const [benefitRows, setBenefitRows] = useState<BenefitRow[]>(
    structured.benefitRows
  )
  const [beneficiaryRows, setBeneficiaryRows] = useState<
    ManualBeneficiaryFormRow[]
  >(() =>
    structured.beneficiaryRows.map((row, index) => ({
      ...row,
      key: `beneficiary-${index}`,
    }))
  )

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isDraft = policy.policyNumber.startsWith('DRAFT-')
  const renewalDiffs =
    !isDraft && extraction
      ? computePolicyExtractionDiff(policy, extraction.fields)
      : []

  async function persistPolicy(mode: 'draft' | 'confirm') {
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      if (
        !values.insurerName.trim() ||
        !values.policyNumber.trim() ||
        !values.holderName.trim()
      ) {
        setFormError(t('errors.requiredFields'))
        return
      }

      const input = buildCreateInputFromForm(
        values,
        agent,
        coverageRows,
        deductibleRows,
        benefitRows,
        beneficiaryRows.map(({ key: _key, ...row }) => row),
        userUid
      )

      const [{ db }, { updatePolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      const { ownerUid: _ownerUid, ...update } = input

      await updatePolicy(
        db,
        policy.id,
        {
          ...update,
          notes:
            mode === 'confirm'
              ? (update.notes?.replace(
                  'Borrador desde upload PDF — datos pendientes de revisión humana.',
                  'Póliza confirmada tras revisión humana.'
                ) ?? update.notes)
              : update.notes,
        },
        userUid
      )

      if (input.beneficiaryEntries && input.beneficiaryEntries.length > 0) {
        await syncPolicyBeneficiaries(policy.id, input.beneficiaryEntries)
      }

      if (mode === 'confirm') {
        await fetch(`/api/policies/${policy.id}/index-documents`, {
          method: 'POST',
        }).catch(() => undefined)
        router.push(`/policies/${policy.id}`)
        return
      }

      setSuccessMessage(t('draftSaved'))
    } catch {
      setFormError(t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persistPolicy('confirm')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
      <section
        aria-label={t('documentPanel')}
        className="glass-panel flex min-h-[420px] flex-col p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-inner)] bg-primary/10 text-primary">
            <FileText className="size-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {t('documentPanel')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('documentPanelHint')}
            </p>
          </div>
        </div>

        {storagePath && fileName ? (
          <PolicyPdfViewer
            storagePath={storagePath}
            fileName={fileName}
            className="mt-6 flex-1"
            highlights={extraction?.bboxes}
          />
        ) : (
          <div className="mt-6 flex flex-1 items-center justify-center rounded-[var(--radius-inner)] border border-dashed border-border/70 bg-white/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t('noDocument')}</p>
          </div>
        )}
      </section>

      <section
        aria-label={t('fieldsPanel')}
        className="glass-panel space-y-5 p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-inner)] bg-accent/10 text-accent">
            <ShieldCheck className="size-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {t('fieldsPanel')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('fieldsPanelHint')}
            </p>
          </div>
        </div>

        {isDraft ? (
          <p className="rounded-[var(--radius-inner)] border border-[var(--primitive-warning)]/30 bg-[var(--primitive-warning)]/5 px-4 py-3 text-sm text-muted-foreground">
            {t('draftNotice')}
          </p>
        ) : null}

        <PolicyUpdatePrompt diffs={renewalDiffs} />

        <PolicyBasicFields
          values={values}
          onChange={(field, value) =>
            setValues((current) => ({ ...current, [field]: value }))
          }
          showExtendedFields
          defaultCurrency={values.currency}
        />

        <PolicyManualBeneficiaries
          rows={beneficiaryRows}
          onChange={setBeneficiaryRows}
        />

        <PolicyStructuredFields
          coverageRows={coverageRows}
          deductibleRows={deductibleRows}
          benefitRows={benefitRows}
          currency={values.currency}
          onCoverageChange={setCoverageRows}
          onDeductibleChange={setDeductibleRows}
          onBenefitChange={setBenefitRows}
        />

        <PolicyAgentFields
          values={agent}
          onChange={(field, value) =>
            setAgent((current) => ({ ...current, [field]: value }))
          }
        />

        {formError ? (
          <p className="text-sm text-[var(--primitive-danger)]" role="alert">
            {formError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="text-sm text-[var(--primitive-success)]" role="status">
            {successMessage}
          </p>
        ) : null}

        <div className="rounded-[var(--radius-inner)] border border-accent/20 bg-accent/5 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('confirmNote')}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="rounded-[var(--radius-pill)]"
            disabled={submitting}
            onClick={() => void persistPolicy('draft')}
          >
            {submitting ? ta('saving') : t('saveDraft')}
          </Button>
          <Button
            type="submit"
            variant="ink"
            className="rounded-[var(--radius-pill)]"
            disabled={submitting}
          >
            {submitting ? ta('saving') : t('confirmPolicy')}
          </Button>
        </div>
      </section>
    </form>
  )
}
