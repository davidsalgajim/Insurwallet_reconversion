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
import { invokeWorkerProcessJob } from '@/lib/server/worker-client'
import { isDraftPolicy } from '@/lib/utils/draft-policy'

function buildStubExtraction(
  policy: PolicyDocument,
  method: PolicyExtraction['method']
): PolicyExtraction {
  const draft = isDraftPolicy(policy)

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
      insurerName:
        draft || policy.insurerName === 'Por confirmar' ? 'low' : 'high',
      policyNumber: draft ? 'medium' : 'high',
      holderName: draft ? 'medium' : 'high',
      premium: policy.premium > 0 ? 'medium' : 'low',
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
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
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
    const [docSnap, policySnap] = await Promise.all([
      docRef.get(),
      db.collection('policies').doc(job.policyId).get(),
    ])

    const policy = policySnap.exists
      ? parsePolicyDocument(
          policySnap.id,
          policySnap.data() as Record<string, unknown>
        )
      : null

    const extraction = PolicyExtractionSchema.parse(
      docSnap.data()?.extraction ??
        buildStubExtraction(
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
        )
    )

    return { jobId, processingState: 'ready', extraction }
  }

  if (job.processingState === 'failed') {
    throw new Error(job.error ?? 'Job failed')
  }

  await updateJobAndDocumentState(job, 'extracting')

  let pipelineMethod: PolicyExtraction['method'] = 'stub'

  try {
    const workerResult = await invokeWorkerProcessJob({
      jobId,
      storagePath: job.storagePath,
    })

    if (workerResult) {
      pipelineMethod =
        workerResult.pipeline_method as PolicyExtraction['method']
    }
  } catch {
    pipelineMethod = 'stub'
  }

  await updateJobAndDocumentState(job, 'analyzing')

  const policySnap = await db.collection('policies').doc(job.policyId).get()

  if (!policySnap.exists) {
    await updateJobAndDocumentState(job, 'failed', {
      error: 'Policy not found',
    })
    throw new Error('Policy not found')
  }

  const policy = parsePolicyDocument(
    policySnap.id,
    policySnap.data() as Record<string, unknown>
  )
  const extraction = buildStubExtraction(policy, pipelineMethod)
  const { id, ...existingPolicy } = policy
  void id
  const updatedPolicy = mergePolicyUpdate(existingPolicy, {
    insurerName: extraction.fields.insurerName,
    policyNumber: extraction.fields.policyNumber,
    holderName: extraction.fields.holderName,
    premium: extraction.fields.premium,
    currency: extraction.fields.currency,
    startDate: extraction.fields.startDate,
    endDate: extraction.fields.endDate,
  })

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
          ...extraction,
          extractedAt: Timestamp.fromDate(extraction.extractedAt),
        },
        processing: {
          state: 'ready',
          jobId,
          method: pipelineMethod === 'stub' ? 'odl' : pipelineMethod,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    transaction.update(jobRef, {
      processingState: 'ready',
      state: 'completed',
      pipeline: [pipelineMethod === 'stub' ? 'odl' : pipelineMethod],
      updatedAt: Timestamp.now(),
    })
  })

  return { jobId, processingState: 'ready', extraction }
}
