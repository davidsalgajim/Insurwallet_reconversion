import { FieldValue, Timestamp } from 'firebase-admin/firestore'

import { getAdminFirestore } from '@/lib/firebase/admin'
import {
  extractionFieldsToAdminFirestore,
  policyToAdminFirestoreData,
} from '@/lib/firebase/policies-admin'
import {
  mergePolicyUpdate,
  parsePolicyDocument,
  type PolicyDocument,
} from '@/lib/firebase/policies'
import { JOBS_COLLECTION } from '@/lib/firebase/jobs'
import { parseDocumentExtraction } from '@/lib/firebase/parse-document-extraction'
import { extractionFieldsToCreateInput } from '@/lib/policies/extraction-mapping'
import { sanitizeAgentForDisplay } from '@/lib/policies/agent-placeholders'
import {
  PolicyExtractionSchema,
  type PolicyExtraction,
} from '@/lib/schemas/extraction'
import type { ProcessingState } from '@/lib/schemas/document'
import type { Job } from '@/lib/schemas/job'
import {
  classifyWorkerFailure,
  invokeWorkerWithRetries,
  parseWorkerExtraction,
  parseWorkerPipelineSteps,
  USER_FACING_JOB_ERRORS,
  withJobProcessingTimeout,
} from '@/lib/server/worker-client'
import { notifyDocumentJobReady } from '@/lib/server/push-notifications'
import { persistExtractedDocumentText } from '@/lib/server/document-text-storage'

function buildFallbackExtraction(
  policy: PolicyDocument,
  method: PolicyExtraction['method']
): PolicyExtraction {
  const agent = sanitizeAgentForDisplay(policy.agent)

  return PolicyExtractionSchema.parse({
    fields: {
      insurerName: policy.insurerName,
      policyNumber: policy.policyNumber,
      holderName: policy.holderName,
      premium: policy.premium > 0 ? policy.premium : undefined,
      currency: policy.currency,
      startDate: policy.startDate,
      endDate: policy.endDate,
      ...(agent ? { agent } : {}),
    },
    confidence: {
      insurerName: 'low',
      policyNumber: 'low',
      holderName: 'low',
      premium: 'low',
    },
    method,
    extractedAt: new Date(),
  })
}

async function updateJobAndDocumentState(
  job: Job & { id: string },
  processingState: ProcessingState,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const db = getAdminFirestore()

  await db
    .collection(JOBS_COLLECTION)
    .doc(job.id)
    .update({
      processingState,
      state:
        processingState === 'failed'
          ? 'failed'
          : processingState === 'ready'
            ? 'completed'
            : 'processing',
      updatedAt: Timestamp.now(),
      ...extra,
    })

  await db
    .collection('policies')
    .doc(job.policyId)
    .collection('documents')
    .doc(job.docId)
    .set(
      {
        processing: {
          state: processingState,
          jobId: job.id,
          ...(typeof extra.error === 'string' ? { error: extra.error } : {}),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
}

function mergeExtractionIntoPolicy(
  policy: PolicyDocument,
  extraction: PolicyExtraction
) {
  const { id, ...existingPolicy } = policy
  void id

  const input = extractionFieldsToCreateInput(
    extraction.fields,
    existingPolicy.ownerUid,
    existingPolicy
  )
  const { ownerUid: _ownerUid, ...update } = input
  return mergePolicyUpdate(existingPolicy, update)
}

export type ProcessDocumentJobResult = {
  jobId: string
  processingState: ProcessingState
  extraction: PolicyExtraction
}

export async function processDocumentJob(
  jobId: string,
  actorUid: string,
  options?: { force?: boolean }
): Promise<ProcessDocumentJobResult> {
  const db = getAdminFirestore()
  const jobRef = db.collection(JOBS_COLLECTION).doc(jobId)
  const jobSnap = await jobRef.get()

  if (!jobSnap.exists) {
    throw new Error('Job not found')
  }

  const job = {
    id: jobSnap.id,
    ...(jobSnap.data() as Job),
  }

  if (job.ownerUid !== actorUid) {
    throw new Error('Forbidden')
  }

  const docRef = db
    .collection('policies')
    .doc(job.policyId)
    .collection('documents')
    .doc(job.docId)

  if (job.processingState === 'ready' && !options?.force) {
    const docSnap = await docRef.get()
    const stored = docSnap.data()?.extraction

    if (stored) {
      const extraction = parseDocumentExtraction({ extraction: stored })
      if (extraction) {
        return {
          jobId,
          processingState: 'ready',
          extraction,
        }
      }
    }

    const policySnap = await db.collection('policies').doc(job.policyId).get()
    const policy = policySnap.exists
      ? parsePolicyDocument(
          policySnap.id,
          policySnap.data() as Record<string, unknown>
        )
      : null

    return {
      jobId,
      processingState: 'ready',
      extraction: buildFallbackExtraction(
        policy ?? {
          id: job.policyId,
          ownerUid: job.ownerUid,
          insurerName: 'Por confirmar',
          policyNumber: 'DRAFT-PENDING',
          holderName: 'Por confirmar',
          policyType: 'other',
          startDate: new Date(),
          endDate: new Date(),
          hasNoExpiration: false,
          premium: 0,
          currency: 'COP',
          paymentFrequency: 'annual',
          agent: { name: '', phone: '', email: '' },
          coverageEntries: [],
          deductibleEntries: [],
          beneficiaryEntries: [],
          benefitEntries: [],
          sharedWith: [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'stub'
      ),
    }
  }

  if (job.processingState === 'failed' && !options?.force) {
    throw new Error(job.error ?? USER_FACING_JOB_ERRORS.generic)
  }

  const attemptNumber = (job.attempts ?? 0) + 1

  await updateJobAndDocumentState(job, 'extracting', {
    attempts: attemptNumber,
  })

  let extraction: PolicyExtraction
  let pipelineMethod: PolicyExtraction['method'] = 'odl'
  let pipelineSteps: ReturnType<typeof parseWorkerPipelineSteps> = []
  let documentTextPayload: Awaited<
    ReturnType<typeof persistExtractedDocumentText>
  > = null

  try {
    const workerResult = await withJobProcessingTimeout(
      invokeWorkerWithRetries({
        jobId,
        storagePath: job.storagePath,
      })
    )

    extraction = parseWorkerExtraction(workerResult.extraction!)
    pipelineMethod = extraction.method
    pipelineSteps = parseWorkerPipelineSteps(
      workerResult.pipeline_steps,
      pipelineMethod
    )

    if (workerResult.document_text?.trim()) {
      documentTextPayload = await persistExtractedDocumentText({
        pdfStoragePath: job.storagePath,
        text: workerResult.document_text,
      })
    }
  } catch (error) {
    const workerError = classifyWorkerFailure(error)
    const storedMessage =
      process.env.NODE_ENV === 'development' && workerError.devHint
        ? `${workerError.message}\n\n${workerError.devHint}`
        : workerError.message

    await updateJobAndDocumentState(job, 'failed', {
      attempts: attemptNumber,
      error: storedMessage,
    })
    throw workerError
  }

  await updateJobAndDocumentState(job, 'analyzing')

  try {
    const policySnap = await db.collection('policies').doc(job.policyId).get()

    if (!policySnap.exists) {
      await updateJobAndDocumentState(job, 'failed', {
        error: USER_FACING_JOB_ERRORS.policyNotFound,
      })
      throw new Error(USER_FACING_JOB_ERRORS.policyNotFound)
    }

    const policy = parsePolicyDocument(
      policySnap.id,
      policySnap.data() as Record<string, unknown>
    )
    const updatedPolicy = mergeExtractionIntoPolicy(policy, extraction)

    await db.runTransaction(async (transaction) => {
      transaction.update(
        db.collection('policies').doc(job.policyId),
        policyToAdminFirestoreData(updatedPolicy)
      )

      transaction.set(
        docRef,
        {
          extraction: {
            fields: extractionFieldsToAdminFirestore(extraction.fields),
            confidence: extraction.confidence,
            ...(extraction.bboxes ? { bboxes: extraction.bboxes } : {}),
            method: pipelineMethod,
            extractedAt: Timestamp.fromDate(extraction.extractedAt),
          },
          ...(documentTextPayload
            ? {
                extractedSummary: documentTextPayload.extractedSummary,
                ...(documentTextPayload.extractedTextPath
                  ? {
                      extractedTextPath: documentTextPayload.extractedTextPath,
                    }
                  : {}),
                ragWordCount: documentTextPayload.ragWordCount,
              }
            : {}),
          processing: {
            state: 'ready',
            jobId,
            method: pipelineMethod,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      transaction.update(jobRef, {
        processingState: 'ready',
        state: 'completed',
        pipeline:
          pipelineSteps.length > 0
            ? pipelineSteps
            : parseWorkerPipelineSteps(undefined, pipelineMethod),
        error: FieldValue.delete(),
        updatedAt: Timestamp.now(),
      })
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : USER_FACING_JOB_ERRORS.generic

    if (message !== USER_FACING_JOB_ERRORS.policyNotFound) {
      await updateJobAndDocumentState(job, 'failed', {
        attempts: attemptNumber,
        error: USER_FACING_JOB_ERRORS.generic,
      })
      throw new Error(USER_FACING_JOB_ERRORS.generic)
    }

    throw error
  }

  const docSnap = await docRef.get()
  const fileName =
    typeof docSnap.data()?.fileName === 'string'
      ? docSnap.data()?.fileName
      : undefined

  await notifyDocumentJobReady({
    ownerUid: job.ownerUid,
    policyId: job.policyId,
    docId: job.docId,
    fileName,
  }).catch(() => undefined)

  return { jobId, processingState: 'ready', extraction }
}
