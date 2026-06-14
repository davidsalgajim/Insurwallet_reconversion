'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { AppTopbar } from '@/components/layout/app-topbar'
import { CloudAIConsentModal } from '@/components/legal/cloud-ai-consent-modal'
import { useCloudAIConsent } from '@/components/legal/consent'
import { MultiDocumentProcessingList } from '@/components/policies/multi-document-processing-list'
import {
  PdfUploadZone,
  type SelectedUploadFile,
} from '@/components/policies/pdf-upload-zone'
import { PolicyWizardProgress } from '@/components/policies/policy-wizard-progress'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { createDraftPolicyForUpload } from '@/lib/firebase/documents'
import { uploadDocumentsToPolicy } from '@/lib/policies/document-upload'
import { resolveUploadErrorKey } from '@/lib/policies/upload-errors'

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'error'

export default function UploadPolicyPage() {
  const t = useTranslations('policies.upload')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    hasConsent,
    isDeclined,
    loading: consentLoading,
    grantCloudAIConsent,
    declineCloudAIConsent,
  } = useCloudAIConsent()
  const [consentOpen, setConsentOpen] = useState(false)

  const [selectedFiles, setSelectedFiles] = useState<SelectedUploadFile[]>([])
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [policyId, setPolicyId] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ docId: string; fileName: string; jobId?: string }>
  >([])

  const isBusy = phase === 'uploading'

  const handleFilesChange = useCallback(
    (files: SelectedUploadFile[]) => {
      setSelectedFiles(files)
      setErrorMessage(null)
      if (phase === 'error') {
        setPhase('idle')
      }
    },
    [phase]
  )

  async function performUpload() {
    if (selectedFiles.length === 0 || !user) return

    setErrorMessage(null)
    setPhase('uploading')
    setUploadProgress({})

    try {
      const [{ db, storage }] = await Promise.all([
        import('@/lib/firebase/client'),
      ])

      const draftPolicy = await createDraftPolicyForUpload(db, {
        ownerUid: user.uid,
      })

      const result = await uploadDocumentsToPolicy({
        db,
        storage,
        ownerUid: user.uid,
        policyId: draftPolicy.id,
        documents: selectedFiles.map((item) => ({
          localId: item.id,
          file: item.file,
          documentRole: item.documentRole,
        })),
        onFileProgress: (localId, progress) => {
          setUploadProgress((current) => ({ ...current, [localId]: progress }))
        },
      })

      if (!result.ok) {
        setErrorMessage(t(result.errorKey))
        setPhase('error')
        return
      }

      setPolicyId(draftPolicy.id)
      setUploadedDocs(
        result.uploaded.map((item) => ({
          docId: item.docId,
          fileName: item.fileName,
          jobId: item.jobId,
        }))
      )
      setSelectedFiles([])
      setPhase('processing')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[upload] performUpload failed', error)
      }
      setErrorMessage(t(resolveUploadErrorKey(error)))
      setPhase('error')
    }
  }

  function handleUpload() {
    if (selectedFiles.length === 0 || !user) return

    if (!consentLoading && isDeclined) {
      setErrorMessage(t('errors.consentDeclined'))
      setPhase('error')
      return
    }

    if (!consentLoading && !hasConsent) {
      setConsentOpen(true)
      return
    }

    void performUpload()
  }

  async function handleConsentAccept() {
    await grantCloudAIConsent({ source: 'upload' })
    setConsentOpen(false)
    await performUpload()
  }

  async function handleConsentDecline() {
    await declineCloudAIConsent({ source: 'upload' })
    setConsentOpen(false)
    setErrorMessage(t('errors.consentDeclined'))
    setPhase('error')
  }

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <CloudAIConsentModal
        open={consentOpen}
        onAccept={() => void handleConsentAccept()}
        onDecline={() => void handleConsentDecline()}
        onCancel={() => setConsentOpen(false)}
      />
      <AppTopbar title={t('title')} subtitle={t('subtitleMulti')} />
      <PolicyWizardProgress currentStep={2} />

      {phase === 'processing' && user && policyId ? (
        <div className="space-y-6">
          <MultiDocumentProcessingList
            ownerUid={user.uid}
            policyId={policyId}
            documents={uploadedDocs}
            reviewHref={`/policies/${policyId}/review`}
          />

          <div className="rounded-[var(--radius-card)] border border-accent/20 bg-accent/5 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('confirmNoteMulti')}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-[var(--radius-pill)]"
              onClick={() => router.push('/policies/new')}
            >
              {t('back')}
            </Button>
            <Button
              type="button"
              variant="ink"
              className="rounded-[var(--radius-pill)]"
              disabled={!policyId}
              onClick={() => {
                if (policyId) {
                  router.push(`/policies/${policyId}`)
                }
              }}
            >
              {t('viewDraft')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-panel space-y-6 p-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {t('sectionTitleMulti')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('sectionDescMulti')}
            </p>
          </div>

          <PdfUploadZone
            disabled={isBusy || authLoading || !user}
            selectedFiles={selectedFiles}
            onFilesChange={handleFilesChange}
            errorMessage={errorMessage}
            showRoleSelector
          />

          {phase === 'uploading' ? (
            <div className="space-y-3" aria-live="polite">
              {selectedFiles.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span className="truncate">{item.file.name}</span>
                    <span>
                      {Math.round((uploadProgress[item.id] ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/60 ring-1 ring-border">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200"
                      style={{
                        width: `${Math.round((uploadProgress[item.id] ?? 0) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!authLoading && !user ? (
            <p className="text-sm text-muted-foreground">{t('authRequired')}</p>
          ) : null}

          {errorMessage && isDeclined ? (
            <p className="text-sm text-muted-foreground">
              {t('errors.consentDeclinedHint')}{' '}
              <Link
                href="/settings"
                className="font-medium text-primary hover:underline"
              >
                {t('errors.consentSettingsLink')}
              </Link>
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-[var(--radius-pill)]"
              onClick={() => router.push('/policies/new')}
              disabled={isBusy}
            >
              {t('back')}
            </Button>
            <Button
              type="button"
              variant="ink"
              className="rounded-[var(--radius-pill)]"
              disabled={
                selectedFiles.length === 0 || isBusy || authLoading || !user
              }
              onClick={handleUpload}
            >
              {phase === 'uploading'
                ? t('uploading')
                : t('startUploadMulti', { count: selectedFiles.length })}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
