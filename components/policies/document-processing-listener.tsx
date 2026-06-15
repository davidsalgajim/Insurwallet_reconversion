'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { DocumentProcessingStatus } from '@/components/policies/document-processing-status'
import type { ProcessingState } from '@/lib/schemas/document'
import {
  subscribeToDocumentJob,
  subscribeToJob,
  isJobDataInvalidError,
  type DocumentJobSnapshot,
} from '@/lib/firebase/jobs'

type DocumentProcessingListenerProps = {
  ownerUid: string
  policyId: string
  docId: string
  fileName: string
  jobId?: string
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
  jobId,
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
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const processRequestedRef = useRef(false)
  const notifiedTerminalStateRef = useRef<'ready' | 'failed' | null>(null)
  const onReadyRef = useRef(onReady)
  const onFailedRef = useRef(onFailed)

  useEffect(() => {
    onReadyRef.current = onReady
    onFailedRef.current = onFailed
  }, [onReady, onFailed])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    void import('@/lib/firebase/client').then(({ db }) => {
      unsubscribe = jobId
        ? subscribeToJob(db, jobId, setSnapshot)
        : subscribeToDocumentJob(db, { ownerUid, policyId, docId }, setSnapshot)
    })

    return () => {
      unsubscribe?.()
    }
  }, [ownerUid, policyId, docId, jobId])

  const processingState = resolveProcessingState(snapshot)

  useEffect(() => {
    if (!snapshot.job || processRequestedRef.current) {
      return
    }

    if (snapshot.job.processingState !== 'pending') {
      return
    }

    processRequestedRef.current = true

    void fetch(`/api/jobs/${snapshot.job.id}/process`, {
      method: 'POST',
    }).catch(() => {
      processRequestedRef.current = false
    })
  }, [snapshot.job])

  const processingStateValue = snapshot.job?.processingState
  const jobError = snapshot.job?.error
  const jobIdValue = snapshot.job?.id

  useEffect(() => {
    if (!jobIdValue || !processingStateValue) {
      return
    }

    if (processingStateValue !== 'ready' && processingStateValue !== 'failed') {
      notifiedTerminalStateRef.current = null
      return
    }

    if (
      processingStateValue === 'ready' &&
      notifiedTerminalStateRef.current !== 'ready'
    ) {
      notifiedTerminalStateRef.current = 'ready'
      onReadyRef.current?.(jobIdValue)
      return
    }

    if (
      processingStateValue === 'failed' &&
      notifiedTerminalStateRef.current !== 'failed'
    ) {
      notifiedTerminalStateRef.current = 'failed'
      setFailureMessage(jobError ?? null)
      onFailedRef.current?.(jobError)
    }
  }, [jobIdValue, processingStateValue, jobError])

  return (
    <div className={className}>
      <DocumentProcessingStatus
        state={processingState}
        fileName={fileName}
        failureMessage={failureMessage}
      />

      {snapshot.error ? (
        <p className="mt-3 text-sm text-[var(--primitive-danger)]">
          {isJobDataInvalidError(snapshot.error)
            ? t('jobDataInvalid')
            : snapshot.error.message.includes('insufficient permissions')
              ? t('jobPermissionDenied')
              : t('failed')}
        </p>
      ) : null}

      {!snapshot.loading && !snapshot.job ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('waitingJob')}</p>
      ) : null}
    </div>
  )
}
