'use client'

import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { AppTopbar } from '@/components/layout/app-topbar'
import { PolicyPdfViewer } from '@/components/policies/policy-pdf-viewer'
import { PolicyWizardProgress } from '@/components/policies/policy-wizard-progress'
import { usePolicyDocuments } from '@/hooks/usePolicyDocuments'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import { usePolicy } from '@/hooks/usePolicy'
import type { PolicyDocument } from '@/lib/firebase/policies'
import type { PolicyExtraction } from '@/lib/schemas/extraction'
import { cn } from '@/lib/utils/cn'

type ConfidenceLevel = 'high' | 'medium' | 'low'

type ReviewFieldId = 'insurerName' | 'policyNumber' | 'holderName' | 'premium'

type ReviewFieldState = {
  id: ReviewFieldId
  value: string
  confidence: ConfidenceLevel
}

function confidenceForField(
  fieldId: ReviewFieldId,
  value: string,
  extraction?: PolicyExtraction
): ConfidenceLevel {
  const fromExtraction = extraction?.confidence[fieldId]
  if (
    fromExtraction === 'high' ||
    fromExtraction === 'medium' ||
    fromExtraction === 'low'
  ) {
    return fromExtraction
  }

  if (!value.trim()) {
    return 'low'
  }

  return 'medium'
}

function confidenceBadgeClass(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'bg-[var(--primitive-success)]/10 text-[var(--primitive-success)] ring-[var(--primitive-success)]/20'
    case 'medium':
      return 'bg-[var(--primitive-warning)]/10 text-[var(--primitive-warning)] ring-[var(--primitive-warning)]/20'
    case 'low':
      return 'bg-[var(--primitive-danger)]/10 text-[var(--primitive-danger)] ring-[var(--primitive-danger)]/20'
  }
}

function parsePremiumInput(value: string): number {
  const digits = value.replace(/[^\d.,]/g, '').replace(',', '.')
  const parsed = Number.parseFloat(digits)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function buildReviewFields(
  policy: PolicyDocument,
  extraction?: PolicyExtraction
): ReviewFieldState[] {
  const fields = extraction?.fields

  return [
    {
      id: 'insurerName',
      value: fields?.insurerName ?? policy.insurerName,
      confidence: confidenceForField(
        'insurerName',
        fields?.insurerName ?? policy.insurerName,
        extraction
      ),
    },
    {
      id: 'policyNumber',
      value: fields?.policyNumber ?? policy.policyNumber,
      confidence: confidenceForField(
        'policyNumber',
        fields?.policyNumber ?? policy.policyNumber,
        extraction
      ),
    },
    {
      id: 'holderName',
      value: fields?.holderName ?? policy.holderName,
      confidence: confidenceForField(
        'holderName',
        fields?.holderName ?? policy.holderName,
        extraction
      ),
    },
    {
      id: 'premium',
      value:
        fields?.premium != null && fields.premium > 0
          ? String(fields.premium)
          : policy.premium > 0
            ? String(policy.premium)
            : '',
      confidence: confidenceForField(
        'premium',
        fields?.premium != null && fields.premium > 0
          ? String(fields.premium)
          : policy.premium > 0
            ? String(policy.premium)
            : '',
        extraction
      ),
    },
  ]
}

type ReviewPolicyFormProps = {
  policy: PolicyDocument
  userUid: string
  storagePath?: string
  fileName?: string
  extraction?: PolicyExtraction
}

function ReviewPolicyForm({
  policy,
  userUid,
  storagePath,
  fileName,
  extraction,
}: ReviewPolicyFormProps) {
  const t = useTranslations('policies.review')
  const tFields = useTranslations('policies.fields')
  const ta = useTranslations('common.actions')
  const router = useRouter()

  const [fields, setFields] = useState<ReviewFieldState[]>(() =>
    buildReviewFields(policy, extraction)
  )
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeFieldId, setActiveFieldId] = useState<ReviewFieldId | null>(null)
  const [hoveredFieldId, setHoveredFieldId] = useState<ReviewFieldId | null>(
    null
  )

  const isDraft = policy.policyNumber.startsWith('DRAFT-')

  const fieldMap = useMemo(() => {
    return Object.fromEntries(
      fields.map((field) => [field.id, field])
    ) as Record<ReviewFieldId, ReviewFieldState>
  }, [fields])

  function updateField(id: ReviewFieldId, value: string) {
    setFields((current) =>
      current.map((field) =>
        field.id === id
          ? {
              ...field,
              value,
              confidence: confidenceForField(id, value, extraction),
            }
          : field
      )
    )
  }

  async function persistPolicy(mode: 'draft' | 'confirm') {
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      const insurerName = fieldMap.insurerName?.value.trim() ?? ''
      const policyNumber = fieldMap.policyNumber?.value.trim() ?? ''
      const holderName = fieldMap.holderName?.value.trim() ?? ''
      const premium = parsePremiumInput(fieldMap.premium?.value ?? '')

      if (!insurerName || !policyNumber || !holderName) {
        setFormError(t('errors.requiredFields'))
        return
      }

      const [{ db }, { updatePolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      await updatePolicy(
        db,
        policy.id,
        {
          insurerName,
          policyNumber,
          holderName,
          premium,
          notes:
            mode === 'confirm'
              ? (policy.notes?.replace(
                  'Borrador desde upload PDF — datos pendientes de revisión humana.',
                  'Póliza confirmada tras revisión humana.'
                ) ?? policy.notes)
              : policy.notes,
        },
        userUid
      )

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
            activeHighlightId={activeFieldId}
            hoveredHighlightId={hoveredFieldId}
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

        <ul className="space-y-4">
          {fields.map((field) => (
            <li
              key={field.id}
              className={cn(
                'rounded-[var(--radius-inner)] border bg-white/50 p-4 transition-colors',
                activeFieldId === field.id
                  ? 'border-primary/50 ring-2 ring-primary/20'
                  : 'border-border/60'
              )}
              onMouseEnter={() => setHoveredFieldId(field.id)}
              onMouseLeave={() =>
                setHoveredFieldId((current) =>
                  current === field.id ? null : current
                )
              }
              onFocus={() => setActiveFieldId(field.id)}
              onBlur={() =>
                setActiveFieldId((current) =>
                  current === field.id ? null : current
                )
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor={`review-${field.id}`}
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {tFields(field.id)}
                </label>
                <span
                  className={cn(
                    'inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                    confidenceBadgeClass(field.confidence)
                  )}
                >
                  {t(`confidence.${field.confidence}`)}
                </span>
              </div>
              <input
                id={`review-${field.id}`}
                value={field.value}
                onChange={(event) => updateField(field.id, event.target.value)}
                onFocus={() => setActiveFieldId(field.id)}
                required={field.id !== 'premium'}
                className="mt-2 w-full rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm font-medium outline-none ring-primary/30 transition focus-visible:ring-2"
              />
            </li>
          ))}
        </ul>

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

export function PolicyReviewView() {
  const t = useTranslations('policies.review')
  const params = useParams<{ id: string }>()
  const policyId = params.id
  const { user, loading: authLoading } = useAuth()
  const { policy, loading, error } = usePolicy(policyId)
  const { documents, loading: documentsLoading } = usePolicyDocuments(policyId)
  const primaryDocument = documents[0]

  if (loading || authLoading) {
    return (
      <div className="animate-fade-up mx-auto max-w-6xl">
        <AppTopbar title={t('title')} subtitle={t('subtitle')} />
        <div className="glass-panel h-96 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fade-up mx-auto max-w-6xl">
        <AppTopbar title={t('title')} subtitle={t('subtitle')} />
        <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />
      <PolicyWizardProgress currentStep={3} />

      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-[var(--radius-pill)]"
          asChild
        >
          <Link href={`/policies/${policyId}`}>
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            {t('backToDetail')}
          </Link>
        </Button>
      </div>

      {!user || !policy || documentsLoading ? (
        <p className="text-sm text-muted-foreground">
          {!user || !policy ? t('authRequired') : t('pdfLoading')}
        </p>
      ) : (
        <ReviewPolicyForm
          key={`${policy.id}-${primaryDocument?.extraction?.extractedAt?.toString() ?? 'none'}`}
          policy={policy}
          userUid={user.uid}
          storagePath={primaryDocument?.storagePath}
          fileName={primaryDocument?.fileName}
          extraction={primaryDocument?.extraction}
        />
      )}
    </div>
  )
}
