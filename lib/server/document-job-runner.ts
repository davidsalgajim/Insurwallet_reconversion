import { FieldValue, Timestamp } from 'firebase-admin/firestore'

import { getAdminFirestore } from '@/lib/firebase/admin'
import {
  mergePolicyUpdate,
  parsePolicyDocument,
  type PolicyDocument,
} from '@/lib/firebase/policies'
import { JOBS_COLLECTION } from '@/lib/firebase/jobs'
import {
  PolicyExtractionSchema,
  type PolicyExtraction,
} from '@/lib/schemas/extraction'
import type { ProcessingState } from '@/lib/schemas/document'
import type { Job } from '@/lib/schemas/job'
import {
  invokeWorkerWithRetries,
  parseWorkerExtraction,
  USER_FACING_JOB_ERRORS,
} from '@/lib/server/worker-client'
import { notifyDocumentJobReady } from '@/lib/server/push-notifications'

function buildFallbackExtraction(
  policy: PolicyDocument,
  method: PolicyExtraction['method']
): PolicyExtraction {
  return PolicyExtractionSchema.parse({
    fields: {
      insurerName: policy.insurerName,
      policyNumber: policy.policyNumber,
      holderName: policy.holderName,
      premium: policy.premium > 0 ? policy.premium : undefined,
      currency: policy.currency,
      startDate: policy.startDate,
      endDate: policy.endDate,
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

  return mergePolicyUpdate(existingPolicy, {
    insurerName: extraction.fields.insurerName ?? policy.insurerName,
    policyNumber: extraction.fields.policyNumber ?? policy.policyNumber,
    holderName: extraction.fields.holderName ?? policy.holderName,
    premium: extraction.fields.premium ?? policy.premium,
    currency: extraction.fields.currency ?? policy.currency,
    startDate: extraction.fields.startDate ?? policy.startDate,
    endDate: extraction.fields.endDate ?? policy.endDate,
  })
}

export type ProcessDocumentJobResult = {
  jobId: string
  processingState: ProcessingState
  extraction: PolicyExtraction
}

export async function processDocumentJob(
  jobId: string,
  actorUid: string
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

  if (job.processingState === 'ready') {
    const docSnap = await docRef.get()
    const stored = docSnap.data()?.extraction

    if (stored) {
      return {
        jobId,
        processingState: 'ready',
        extraction: PolicyExtractionSchema.parse({
          ...stored,
          extractedAt: stored.extractedAt?.toDate?.() ?? stored.extractedAt,
        }),
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
          premium: 0,
          currency: 'COP',
          paymentFrequency: 'annual',
          agent: {
            name: 'Por definir',
            phone: '+570000000000',
            email: 'pendiente@example.com',
          },
          coverageEntries: [],
          deductibleEntries: [],
          beneficiaryEntries: [],
          sharedWith: [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'stub'
      ),
    }
  }

  if (job.processingState === 'failed') {
    throw new Error(job.error ?? USER_FACING_JOB_ERRORS.generic)
  }

  const attemptNumber = (job.attempts ?? 0) + 1

  await updateJobAndDocumentState(job, 'extracting', {
    attempts: attemptNumber,
  })

  let extraction: PolicyExtraction
  let pipelineMethod: PolicyExtraction['method'] = 'odl'
  let pipelineSteps: string[] = []

  try {
    const workerResult = await invokeWorkerWithRetries({
      jobId,
      storagePath: job.storagePath,
    })

    extraction = parseWorkerExtraction(workerResult.extraction!)
    pipelineMethod = extraction.method
    pipelineSteps = workerResult.pipeline_steps ?? [pipelineMethod]
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const userMessage = message.includes('WORKER_URL')
      ? USER_FACING_JOB_ERRORS.workerUnavailable
      : USER_FACING_JOB_ERRORS.extractionFailed

    await updateJobAndDocumentState(job, 'failed', {
      attempts: attemptNumber,
      error: userMessage,
    })
    throw new Error(userMessage)
  }

  await updateJobAndDocumentState(job, 'analyzing')

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
    transaction.update(db.collection('policies').doc(job.policyId), {
      insurerName: updatedPolicy.insurerName,
      policyNumber: updatedPolicy.policyNumber,
      holderName: updatedPolicy.holderName,
      premium: updatedPolicy.premium,
      currency: updatedPolicy.currency,
      startDate: Timestamp.fromDate(updatedPolicy.startDate),
      endDate: Timestamp.fromDate(updatedPolicy.endDate),
      status: updatedPolicy.status,
      updatedAt: Timestamp.fromDate(updatedPolicy.updatedAt),
    })

    transaction.set(
      docRef,
      {
        extraction: {
          fields: extraction.fields,
          confidence: extraction.confidence,
          method: pipelineMethod,
          extractedAt: Timestamp.fromDate(extraction.extractedAt),
        },
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
      pipeline: pipelineSteps.length > 0 ? pipelineSteps : [pipelineMethod],
      error: FieldValue.delete(),
      updatedAt: Timestamp.now(),
    })
  })

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
