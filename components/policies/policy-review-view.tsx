'use client'

import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { AppTopbar } from '@/components/layout/app-topbar'
import { PolicyWizardProgress } from '@/components/policies/policy-wizard-progress'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

type ConfidenceLevel = 'high' | 'medium' | 'low'

type ReviewField = {
  id: string
  labelKey: string
  value: string
  confidence: ConfidenceLevel
  sourceHint?: string
}

const SKELETON_FIELDS: ReviewField[] = [
  {
    id: 'insurerName',
    labelKey: 'insurerName',
    value: 'Bancolombia Seguros',
    confidence: 'high',
    sourceHint: 'p. 1',
  },
  {
    id: 'policyNumber',
    labelKey: 'policyNumber',
    value: 'POL-2025-001234',
    confidence: 'high',
    sourceHint: 'p. 1',
  },
  {
    id: 'holderName',
    labelKey: 'holderName',
    value: 'Juan Pérez García',
    confidence: 'medium',
    sourceHint: 'p. 2',
  },
  {
    id: 'premium',
    labelKey: 'premium',
    value: 'COP 1.200.000',
    confidence: 'low',
    sourceHint: 'p. 4',
  },
]

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

export function PolicyReviewView() {
  const t = useTranslations('policies.review')
  const tFields = useTranslations('policies.fields')
  const params = useParams<{ id: string }>()
  const policyId = params.id
  const { user, loading: authLoading } = useAuth()

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

      {!authLoading && !user ? (
        <p className="text-sm text-muted-foreground">{t('authRequired')}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
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

            <div className="mt-6 flex flex-1 items-center justify-center rounded-[var(--radius-inner)] border border-dashed border-border/70 bg-white/40 p-8 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t('pdfPlaceholderTitle')}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t('pdfPlaceholderDesc')}
                </p>
              </div>
            </div>
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

            <ul className="space-y-4">
              {SKELETON_FIELDS.map((field) => (
                <li
                  key={field.id}
                  className="rounded-[var(--radius-inner)] border border-border/60 bg-white/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`review-${field.id}`}
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {tFields(field.labelKey)}
                    </label>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                        confidenceBadgeClass(field.confidence)
                      )}
                    >
                      {t(`confidence.${field.confidence}`)}
                      {field.sourceHint ? (
                        <span className="ml-1.5 font-normal normal-case opacity-80">
                          · {field.sourceHint}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <input
                    id={`review-${field.id}`}
                    defaultValue={field.value}
                    className="mt-2 w-full rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm font-medium outline-none ring-primary/30 transition focus-visible:ring-2"
                  />
                </li>
              ))}
            </ul>

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
                disabled
              >
                {t('saveDraft')}
              </Button>
              <Button
                type="button"
                variant="ink"
                className="rounded-[var(--radius-pill)]"
                disabled
              >
                {t('confirmPolicy')}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
