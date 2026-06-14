'use client'

import { useState } from 'react'
import { FilePlus2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { CloudAIConsentModal } from '@/components/legal/cloud-ai-consent-modal'
import { useCloudAIConsent } from '@/components/legal/consent'
import { MultiDocumentProcessingList } from '@/components/policies/multi-document-processing-list'
import {
  PdfUploadZone,
  type SelectedUploadFile,
} from '@/components/policies/pdf-upload-zone'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { uploadDocumentsToPolicy } from '@/lib/policies/document-upload'
import { resolveUploadErrorKey } from '@/lib/policies/upload-errors'

type AddPolicyDocumentsPanelProps = {
  policyId: string
  isExpired?: boolean
}

type PanelPhase = 'idle' | 'uploading' | 'processing' | 'error'

export function AddPolicyDocumentsPanel({
  policyId,
  isExpired = false,
}: AddPolicyDocumentsPanelProps) {
  const t = useTranslations('policies.documents')
  const tu = useTranslations('policies.upload')
  const { user } = useAuth()
  const {
    hasConsent,
    isDeclined,
    loading: consentLoading,
    grantCloudAIConsent,
    declineCloudAIConsent,
  } = useCloudAIConsent()

  const [open, setOpen] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<SelectedUploadFile[]>([])
  const [phase, setPhase] = useState<PanelPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ docId: string; fileName: string }>
  >([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  )

  const isBusy = phase === 'uploading'

  async function performUpload() {
    if (!user || selectedFiles.length === 0) return

    setErrorMessage(null)
    setPhase('uploading')

    try {
      const [{ db, storage }] = await Promise.all([
        import('@/lib/firebase/client'),
      ])

      const result = await uploadDocumentsToPolicy({
        db,
        storage,
        ownerUid: user.uid,
        policyId,
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
        setErrorMessage(tu(result.errorKey))
        setPhase('error')
        return
      }

      setUploadedDocs(
        result.uploaded.map((item) => ({
          docId: item.docId,
          fileName: item.fileName,
        }))
      )
      setSelectedFiles([])
      setPhase('processing')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[add-policy-documents] upload failed', error)
      }
      setErrorMessage(tu(resolveUploadErrorKey(error)))
      setPhase('error')
    }
  }

  function handleUploadClick() {
    if (!user || selectedFiles.length === 0) return

    if (!consentLoading && isDeclined) {
      setErrorMessage(tu('errors.consentDeclined'))
      setPhase('error')
      return
    }

    if (!consentLoading && !hasConsent) {
      setConsentOpen(true)
      return
    }

    void performUpload()
  }

  return (
    <div className="elevated-card space-y-4 p-6">
      <CloudAIConsentModal
        open={consentOpen}
        onAccept={() => {
          void grantCloudAIConsent({ source: 'upload' }).then(() => {
            setConsentOpen(false)
            void performUpload()
          })
        }}
        onDecline={() => {
          void declineCloudAIConsent({ source: 'upload' }).then(() => {
            setConsentOpen(false)
            setErrorMessage(tu('errors.consentDeclined'))
            setPhase('error')
          })
        }}
        onCancel={() => setConsentOpen(false)}
      />

      {isExpired ? (
        <div className="rounded-[var(--radius-inner)] border border-[var(--primitive-warning)]/30 bg-[var(--primitive-warning)]/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {t('expiredRenewalBanner')}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        {phase !== 'processing' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-[var(--radius-pill)]"
            onClick={() => setOpen((value) => !value)}
          >
            <FilePlus2 className="size-4" strokeWidth={1.5} />
            {isExpired ? t('addRenewalDocs') : t('addDocuments')}
          </Button>
        ) : null}
      </div>

      {phase === 'processing' && user ? (
        <MultiDocumentProcessingList
          ownerUid={user.uid}
          policyId={policyId}
          documents={uploadedDocs}
          reviewHref={`/policies/${policyId}/review`}
        />
      ) : null}

      {open && phase !== 'processing' ? (
        <div className="space-y-4 border-t border-border/60 pt-4">
          <PdfUploadZone
            disabled={isBusy || !user}
            selectedFiles={selectedFiles}
            onFilesChange={setSelectedFiles}
            errorMessage={errorMessage}
            showRoleSelector
          />

          {isBusy ? (
            <div className="space-y-2" aria-live="polite">
              {selectedFiles.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate">{item.file.name}</span>
                    <span>
                      {Math.round((uploadProgress[item.id] ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/60 ring-1 ring-border">
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

          {errorMessage && isDeclined ? (
            <p className="text-sm text-muted-foreground">
              {tu('errors.consentDeclinedHint')}{' '}
              <Link
                href="/settings"
                className="font-medium text-primary hover:underline"
              >
                {tu('errors.consentSettingsLink')}
              </Link>
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-[var(--radius-pill)]"
              onClick={() => {
                setOpen(false)
                setSelectedFiles([])
                setErrorMessage(null)
                setPhase('idle')
              }}
              disabled={isBusy}
            >
              {tu('back')}
            </Button>
            <Button
              type="button"
              variant="ink"
              size="sm"
              className="rounded-[var(--radius-pill)]"
              disabled={isBusy || selectedFiles.length === 0 || !user}
              onClick={handleUploadClick}
            >
              {isBusy ? tu('uploading') : t('uploadAndProcess')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
