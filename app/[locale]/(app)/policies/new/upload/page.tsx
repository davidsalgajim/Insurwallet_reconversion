'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { AppTopbar } from '@/components/layout/app-topbar'
import { CloudAIConsentModal } from '@/components/legal/cloud-ai-consent-modal'
import { useCloudAIConsent } from '@/components/legal/consent'
import { DocumentProcessingListener } from '@/components/policies/document-processing-listener'
import { PdfUploadZone } from '@/components/policies/pdf-upload-zone'
import { PolicyWizardProgress } from '@/components/policies/policy-wizard-progress'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  createDraftPolicyForUpload,
  registerUploadedDocument,
} from '@/lib/firebase/documents'
import { uploadPolicyPdf } from '@/lib/firebase/storage'
import {
  MAX_UPLOAD_BYTES,
  validatePolicyUploadFile,
} from '@/lib/schemas/upload'

type UploadPhase =
  | 'idle'
  | 'validating'
  | 'optimizing'
  | 'uploading'
  | 'processing'
  | 'error'

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [policyId, setPolicyId] = useState<string | null>(null)
  const [docId, setDocId] = useState<string | null>(null)

  const isBusy =
    phase === 'validating' || phase === 'optimizing' || phase === 'uploading'

  const handleFileSelect = useCallback(
    (file: File | null) => {
      setSelectedFile(file)
      setErrorMessage(null)
      if (phase === 'error') {
        setPhase('idle')
      }
    },
    [phase]
  )

  async function performUpload() {
    if (!selectedFile || !user) return

    setErrorMessage(null)
    setPhase('validating')

    try {
      if (selectedFile.size > MAX_UPLOAD_BYTES) {
        setPhase('optimizing')
      }

      const validation = await validatePolicyUploadFile(selectedFile)

      if (!validation.ok) {
        setErrorMessage(t(validation.errorKey))
        setPhase('error')
        return
      }

      setPhase('uploading')
      setProgress(0)

      const [{ db, storage }] = await Promise.all([
        import('@/lib/firebase/client'),
      ])

      const draftPolicy = await createDraftPolicyForUpload(db, {
        ownerUid: user.uid,
      })
      const docId = crypto.randomUUID()

      const { storagePath } = await uploadPolicyPdf({
        storage,
        file: validation.file,
        docId,
        input: {
          ownerUid: user.uid,
          policyId: draftPolicy.id,
          fileName: validation.file.name,
          fileSize: validation.file.size,
          mimeType: validation.mimeType,
        },
        onProgress: ({ progress: value }) => setProgress(value),
      })

      await registerUploadedDocument(db, {
        policyId: draftPolicy.id,
        docId,
        fileName: validation.file.name,
        storagePath,
        fileSize: validation.file.size,
        mimeType: validation.mimeType,
      })

      setPolicyId(draftPolicy.id)
      setDocId(docId)
      setUploadedFileName(validation.file.name)
      setPhase('processing')
      setSelectedFile(null)
    } catch {
      setErrorMessage(t('errors.uploadFailed'))
      setPhase('error')
    }
  }

  function handleUpload() {
    if (!selectedFile || !user) return

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
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />
      <PolicyWizardProgress currentStep={2} />

      {phase === 'processing' &&
      uploadedFileName &&
      user &&
      policyId &&
      docId ? (
        <div className="space-y-6">
          <DocumentProcessingListener
            ownerUid={user.uid}
            policyId={policyId}
            docId={docId}
            fileName={uploadedFileName}
            onReady={() => {
              router.push(`/policies/${policyId}/review`)
            }}
          />

          <div className="rounded-[var(--radius-card)] border border-accent/20 bg-accent/5 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('confirmNote')}
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
              {t('sectionTitle')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('sectionDesc')}
            </p>
          </div>

          <PdfUploadZone
            disabled={isBusy || authLoading || !user}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            errorMessage={errorMessage}
          />

          {phase === 'uploading' || phase === 'optimizing' ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>
                  {phase === 'optimizing' ? t('optimizing') : t('uploading')}
                </span>
                {phase === 'uploading' ? (
                  <span>{Math.round(progress * 100)}%</span>
                ) : null}
              </div>
              {phase === 'uploading' ? (
                <div className="h-2 overflow-hidden rounded-full bg-white/60 ring-1 ring-border">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              ) : (
                <div className="h-2 overflow-hidden rounded-full bg-white/60 ring-1 ring-border">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
                </div>
              )}
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
              disabled={!selectedFile || isBusy || authLoading || !user}
              onClick={handleUpload}
            >
              {phase === 'validating'
                ? t('validating')
                : phase === 'optimizing'
                  ? t('optimizing')
                  : phase === 'uploading'
                    ? t('uploading')
                    : t('startUpload')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
