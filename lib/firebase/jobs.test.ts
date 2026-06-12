import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import {
  createDocumentProcessingJobInput,
  jobToFirestoreData,
} from '@/lib/firebase/jobs'

describe('createDocumentProcessingJobInput', () => {
  it('builds a queued job with stable id when provided', () => {
    const now = new Date('2025-06-01T12:00:00.000Z')
    const { jobId, job } = createDocumentProcessingJobInput(
      {
        jobId: '11111111-1111-4111-8111-111111111111',
        ownerUid: 'user-1',
        policyId: 'policy-1',
        docId: 'doc-1',
        storagePath: 'users/user-1/policies/policy-1/docs/doc-1/policy.pdf',
      },
      now
    )

    expect(jobId).toBe('11111111-1111-4111-8111-111111111111')
    expect(job.state).toBe('queued')
    expect(job.processingState).toBe('pending')
    expect(job.attempts).toBe(0)
    expect(job.createdAt).toEqual(now)
    expect(job.updatedAt).toEqual(now)
  })
})

describe('jobToFirestoreData', () => {
  it('serializes timestamps for Firestore', () => {
    const now = new Date('2025-06-01T12:00:00.000Z')
    const { job } = createDocumentProcessingJobInput(
      {
        ownerUid: 'user-1',
        policyId: 'policy-1',
        docId: 'doc-1',
        storagePath: 'users/user-1/policies/policy-1/docs/doc-1/policy.pdf',
      },
      now
    )

    const data = jobToFirestoreData(job)

    expect(data.state).toBe('queued')
    expect(data.processingState).toBe('pending')
    expect(data.createdAt).toBeInstanceOf(Timestamp)
    expect(data.updatedAt).toBeInstanceOf(Timestamp)
    expect((data.createdAt as Timestamp).toDate()).toEqual(now)
  })
})
