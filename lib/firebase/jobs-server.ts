import { FieldValue, Timestamp } from 'firebase-admin/firestore'

import { getAdminFirestore } from '@/lib/firebase/admin'
import {
  createDocumentProcessingJobInput,
  JOBS_COLLECTION,
  type CreateDocumentProcessingJobInput,
} from '@/lib/firebase/jobs'
import { JobSchema, type Job, type JobDocument } from '@/lib/schemas/job'

function jobToAdminFirestoreData(job: Job): Record<string, unknown> {
  const payload = JobSchema.parse(job)

  return {
    ...payload,
    createdAt: Timestamp.fromDate(payload.createdAt),
    updatedAt: Timestamp.fromDate(payload.updatedAt),
  }
}

export async function createDocumentProcessingJobAdmin(
  input: CreateDocumentProcessingJobInput
): Promise<JobDocument> {
  const { jobId, job } = createDocumentProcessingJobInput(input)
  const db = getAdminFirestore()
  const jobRef = db.collection(JOBS_COLLECTION).doc(jobId)
  const documentRef = db
    .collection('policies')
    .doc(input.policyId)
    .collection('documents')
    .doc(input.docId)

  await db.runTransaction(async (transaction) => {
    transaction.set(jobRef, jobToAdminFirestoreData(job))
    transaction.set(
      documentRef,
      {
        processing: {
          state: 'pending',
          jobId,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  })

  return { id: jobId, ...job }
}
