import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { z } from 'zod'

import {
  JobSchema,
  parseJobDocument,
  type Job,
  type JobDocument,
} from '@/lib/schemas/job'

export type SubscribeToDocumentJobInput = {
  ownerUid: string
  policyId: string
  docId: string
}

export type DocumentJobSnapshot = {
  job: JobDocument | null
  loading: boolean
  error: Error | null
}

export const CreateDocumentProcessingJobInputSchema = z.object({
  ownerUid: z.string().min(1),
  policyId: z.string().min(1),
  docId: z.string().min(1),
  storagePath: z.string().min(1),
  jobId: z.string().uuid().optional(),
})

export type CreateDocumentProcessingJobInput = z.infer<
  typeof CreateDocumentProcessingJobInputSchema
>

export const UpdateDocumentProcessingJobInputSchema = z
  .object({
    state: JobSchema.shape.state.optional(),
    processingState: JobSchema.shape.processingState.optional(),
    attempts: JobSchema.shape.attempts.optional(),
    pipeline: JobSchema.shape.pipeline.optional(),
    error: JobSchema.shape.error.optional(),
    timings: JobSchema.shape.timings.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required to update a job'
  )

export type UpdateDocumentProcessingJobInput = z.infer<
  typeof UpdateDocumentProcessingJobInputSchema
>

export const JOBS_COLLECTION = 'jobs'

function firestoreValueToDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return new Date(value as string | number)
}

export function parseJobFirestoreData(
  id: string,
  data: Record<string, unknown>
): JobDocument {
  return parseJobDocument(id, {
    ...data,
    createdAt: firestoreValueToDate(data.createdAt),
    updatedAt: firestoreValueToDate(data.updatedAt),
  })
}

export function createDocumentProcessingJobInput(
  input: CreateDocumentProcessingJobInput,
  now: Date = new Date()
): { jobId: string; job: Job } {
  const parsed = CreateDocumentProcessingJobInputSchema.parse(input)
  const jobId = parsed.jobId ?? crypto.randomUUID()

  const job: Job = {
    ownerUid: parsed.ownerUid,
    policyId: parsed.policyId,
    docId: parsed.docId,
    storagePath: parsed.storagePath,
    state: 'queued',
    processingState: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }

  return { jobId, job }
}

export function jobToFirestoreData(job: Job): Record<string, unknown> {
  const payload = JobSchema.parse(job)

  return {
    ...payload,
    createdAt: Timestamp.fromDate(payload.createdAt),
    updatedAt: Timestamp.fromDate(payload.updatedAt),
  }
}

export async function createDocumentProcessingJob(
  db: Firestore,
  input: CreateDocumentProcessingJobInput
): Promise<JobDocument> {
  const { jobId, job } = createDocumentProcessingJobInput(input)
  const jobRef = doc(db, JOBS_COLLECTION, jobId)

  await setDoc(jobRef, jobToFirestoreData(job))

  return { id: jobId, ...job }
}

export async function updateDocumentProcessingJob(
  db: Firestore,
  jobId: string,
  input: UpdateDocumentProcessingJobInput,
  now: Date = new Date()
): Promise<void> {
  const parsed = UpdateDocumentProcessingJobInputSchema.parse(input)
  const jobRef = doc(db, JOBS_COLLECTION, jobId)

  await updateDoc(jobRef, {
    ...parsed,
    updatedAt: Timestamp.fromDate(now),
  })
}

export function subscribeToDocumentJob(
  db: Firestore,
  input: SubscribeToDocumentJobInput,
  onChange: (snapshot: DocumentJobSnapshot) => void
): Unsubscribe {
  onChange({ job: null, loading: true, error: null })

  const jobsQuery = query(
    collection(db, JOBS_COLLECTION),
    where('ownerUid', '==', input.ownerUid),
    where('policyId', '==', input.policyId),
    where('docId', '==', input.docId),
    limit(1)
  )

  return onSnapshot(
    jobsQuery,
    (snapshot) => {
      const docSnap = snapshot.docs[0]

      if (!docSnap) {
        onChange({ job: null, loading: false, error: null })
        return
      }

      try {
        const job = parseJobFirestoreData(docSnap.id, docSnap.data())
        onChange({ job, loading: false, error: null })
      } catch (error) {
        onChange({
          job: null,
          loading: false,
          error:
            error instanceof Error ? error : new Error('Invalid job document'),
        })
      }
    },
    (error) => {
      onChange({ job: null, loading: false, error })
    }
  )
}
