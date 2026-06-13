'use client'

import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { AppTopbar } from '@/components/layout/app-topbar'
import { PolicyReviewForm } from '@/components/policies/policy-review-form'
import { PolicyWizardProgress } from '@/components/policies/policy-wizard-progress'
import { usePolicyDocuments } from '@/hooks/usePolicyDocuments'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { usePolicy } from '@/hooks/usePolicy'

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
        <PolicyReviewForm
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
