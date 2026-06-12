'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { DocumentProcessingStatus } from '@/components/policies/document-processing-status'
import type { ProcessingState } from '@/lib/schemas/document'
import {
  subscribeToDocumentJob,
  type DocumentJobSnapshot,
} from '@/lib/firebase/jobs'

type DocumentProcessingListenerProps = {
  ownerUid: string
  policyId: string
  docId: string
  fileName: string
  className?: string
  onReady?: (jobId: string) => void
  onFailed?: (message?: string) => void
}

function resolveProcessingState(
  snapshot: DocumentJobSnapshot
): ProcessingState {
  if (snapshot.loading) {
    return 'pending'
  }

  if (snapshot.job?.processingState) {
    return snapshot.job.processingState
  }

  return 'pending'
}

export function DocumentProcessingListener({
  ownerUid,
  policyId,
  docId,
  fileName,
  className,
  onReady,
  onFailed,
}: DocumentProcessingListenerProps) {
  const t = useTranslations('policies.upload.processing')
  const [snapshot, setSnapshot] = useState<DocumentJobSnapshot>({
    job: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    void import('@/lib/firebase/client').then(({ db }) => {
      unsubscribe = subscribeToDocumentJob(
        db,
        { ownerUid, policyId, docId },
        setSnapshot
      )
    })

    return () => {
      unsubscribe?.()
    }
  }, [ownerUid, policyId, docId])

  const processingState = resolveProcessingState(snapshot)

  useEffect(() => {
    if (!snapshot.job) {
      return
    }

    if (snapshot.job.processingState === 'ready') {
      onReady?.(snapshot.job.id)
    }

    if (snapshot.job.processingState === 'failed') {
      onFailed?.(snapshot.job.error)
    }
  }, [snapshot.job, onReady, onFailed])

  return (
    <div className={className}>
      <DocumentProcessingStatus state={processingState} fileName={fileName} />

      {snapshot.error ? (
        <p className="mt-3 text-sm text-[var(--primitive-danger)]">
          {snapshot.error.message}
        </p>
      ) : null}

      {!snapshot.loading && !snapshot.job ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('waitingJob')}</p>
      ) : null}
    </div>
  )
}
