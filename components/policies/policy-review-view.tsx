'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { mergePolicyExtractions } from '@/lib/policies/extraction-merge'
import { cn } from '@/lib/utils/cn'

export function PolicyReviewView() {
  const t = useTranslations('policies.review')
  const params = useParams<{ id: string }>()
  const policyId = params.id
  const { user, loading: authLoading } = useAuth()
  const { policy, loading, error, refresh } = usePolicy(policyId)
  const { documents, loading: documentsLoading } = usePolicyDocuments(policyId)
  const [activeDocId, setActiveDocId] = useState<string | null>(null)

  const mergedExtraction = useMemo(
    () => mergePolicyExtractions(documents.map((doc) => doc.extraction)),
    [documents]
  )

  const extractionSyncToken =
    mergedExtraction?.extractedAt?.toISOString() ?? null

  useEffect(() => {
    if (extractionSyncToken) {
      void refresh()
    }
  }, [extractionSyncToken, refresh])

  const activeDocument = useMemo(() => {
    if (documents.length === 0) return undefined
    if (activeDocId) {
      return documents.find((doc) => doc.id === activeDocId) ?? documents[0]
    }
    return documents[0]
  }, [activeDocId, documents])

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
        <>
          {documents.length > 1 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className={cn(
                    'rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors',
                    activeDocument?.id === doc.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/70 bg-white/60 text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActiveDocId(doc.id)}
                >
                  {doc.fileName}
                </button>
              ))}
              <span className="self-center text-xs text-muted-foreground">
                {t('mergedFieldsHint')}
              </span>
            </div>
          ) : null}

          <PolicyReviewForm
            key={`${policy.id}-${mergedExtraction?.extractedAt?.toString() ?? 'none'}`}
            policy={policy}
            userUid={user.uid}
            documentId={activeDocument?.id}
            storagePath={activeDocument?.storagePath}
            fileName={activeDocument?.fileName}
            extraction={mergedExtraction ?? activeDocument?.extraction}
          />
        </>
      )}
    </div>
  )
}
