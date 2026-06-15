'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { DocumentProcessingStatus } from '@/components/policies/document-processing-status'
import {
  isJobProcessingSlow,
  isJobProcessingStale,
} from '@/lib/policies/job-processing-constants'
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

async function postProcessJob(
  jobId: string,
  force: boolean
): Promise<{ ok: boolean; error?: string }> {
  const url = force
    ? `/api/jobs/${jobId}/process?force=true`
    : `/api/jobs/${jobId}/process`

  try {
    const response = await fetch(url, { method: 'POST' })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      return { ok: false, error: payload?.error }
    }
    return { ok: true }
  } catch {
    return { ok: false }
  }
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
  const [isRetrying, setIsRetrying] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const processRequestedRef = useRef(false)
  const staleRetryRequestedRef = useRef(false)
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

  const isSlow =
    snapshot.job !== null &&
    isJobProcessingSlow(
      snapshot.job.processingState,
      snapshot.job.updatedAt,
      new Date(clock)
    )

  useEffect(() => {
    if (
      !snapshot.job ||
      snapshot.job.processingState === 'ready' ||
      snapshot.job.processingState === 'failed'
    ) {
      return
    }

    const intervalId = window.setInterval(() => setClock(Date.now()), 15_000)
    return () => window.clearInterval(intervalId)
  }, [snapshot.job?.id, snapshot.job?.processingState])

  useEffect(() => {
    const activeJob = snapshot.job
    if (!activeJob || processRequestedRef.current) {
      return
    }

    if (activeJob.processingState !== 'pending') {
      return
    }

    processRequestedRef.current = true

    void postProcessJob(activeJob.id, false).then((result) => {
      if (!result.ok) {
        processRequestedRef.current = false
        if (result.error) {
          setFailureMessage(result.error)
        }
      }
    })
  }, [snapshot.job])

  useEffect(() => {
    const activeJob = snapshot.job
    if (!activeJob) {
      return
    }

    if (
      !isJobProcessingStale(activeJob.processingState, activeJob.updatedAt) ||
      staleRetryRequestedRef.current
    ) {
      return
    }

    staleRetryRequestedRef.current = true
    processRequestedRef.current = true

    void postProcessJob(activeJob.id, true).then((result) => {
      if (!result.ok) {
        processRequestedRef.current = false
        if (result.error) {
          setFailureMessage(result.error)
        }
      }
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

  const handleRetry = useCallback(async () => {
    const activeJobId = snapshot.job?.id
    if (!activeJobId) {
      return
    }

    processRequestedRef.current = true
    staleRetryRequestedRef.current = true
    setIsRetrying(true)

    const result = await postProcessJob(activeJobId, true)
    if (!result.ok) {
      processRequestedRef.current = false
      if (result.error) {
        setFailureMessage(result.error)
      }
    }

    setIsRetrying(false)
  }, [snapshot.job?.id])

  const canRetry =
    processingState === 'failed' ||
    (processingState !== 'ready' &&
      snapshot.job !== null &&
      isJobProcessingStale(
        snapshot.job.processingState,
        snapshot.job.updatedAt
      ))

  return (
    <div className={className}>
      <DocumentProcessingStatus
        state={processingState}
        fileName={fileName}
        failureMessage={failureMessage}
        isSlow={isSlow}
        canRetry={canRetry}
        isRetrying={isRetrying}
        onRetry={() => {
          void handleRetry()
        }}
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
