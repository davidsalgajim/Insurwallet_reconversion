'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { DocumentProcessingListener } from '@/components/policies/document-processing-listener'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'

export type ProcessingDocumentRef = {
  docId: string
  fileName: string
  jobId?: string
}

type MultiDocumentProcessingListProps = {
  ownerUid: string
  policyId: string
  documents: ProcessingDocumentRef[]
  reviewHref?: string
}

export function MultiDocumentProcessingList({
  ownerUid,
  policyId,
  documents,
  reviewHref,
}: MultiDocumentProcessingListProps) {
  const t = useTranslations('policies.upload.processing')
  const router = useRouter()
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set())
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const navigatedRef = useRef(false)

  const allReady = documents.length > 0 && readyIds.size === documents.length
  const hasFailure = failedIds.size > 0

  useEffect(() => {
    if (!allReady || navigatedRef.current || !reviewHref) {
      return
    }

    navigatedRef.current = true
    router.push(reviewHref)
  }, [allReady, reviewHref, router])

  function markReady(docId: string) {
    setReadyIds((current) => {
      if (current.has(docId)) {
        return current
      }

      const next = new Set(current)
      next.add(docId)
      return next
    })
  }

  function markFailed(docId: string) {
    setFailedIds((current) => {
      if (current.has(docId)) {
        return current
      }

      const next = new Set(current)
      next.add(docId)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('multiProgress', {
          ready: readyIds.size,
          total: documents.length,
        })}
      </p>

      <ul className="space-y-3">
        {documents.map((document) => (
          <li
            key={document.docId}
            className="rounded-[var(--radius-inner)] border border-border/70 bg-white/50 p-4"
          >
            <DocumentProcessingListener
              ownerUid={ownerUid}
              policyId={policyId}
              docId={document.docId}
              fileName={document.fileName}
              jobId={document.jobId}
              onReady={() => markReady(document.docId)}
              onFailed={() => markFailed(document.docId)}
            />
          </li>
        ))}
      </ul>

      {allReady && !reviewHref ? (
        <p className="text-sm font-medium text-[var(--primitive-success)]">
          {t('allReady')}
        </p>
      ) : null}

      {hasFailure ? (
        <p className="text-sm text-[var(--primitive-danger)]">{t('failed')}</p>
      ) : null}

      {allReady && reviewHref ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ink"
            className="rounded-[var(--radius-pill)]"
            onClick={() => router.push(reviewHref)}
          >
            {t('goToReview')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
