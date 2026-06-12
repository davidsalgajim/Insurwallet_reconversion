import { describe, expect, it } from 'vitest'

import { JobSchema, parseJobDocument } from '@/lib/schemas/job'

describe('JobSchema', () => {
  const base = {
    ownerUid: 'owner-1',
    policyId: 'policy-1',
    docId: 'doc-1',
    storagePath: 'users/owner-1/policies/policy-1/docs/doc-1/policy.pdf',
    state: 'queued' as const,
    processingState: 'pending' as const,
    attempts: 0,
    pipeline: ['odl' as const],
    createdAt: new Date('2025-06-01T12:00:00.000Z'),
    updatedAt: new Date('2025-06-01T12:00:00.000Z'),
  }

  it('accepts a valid queued job', () => {
    expect(JobSchema.safeParse(base).success).toBe(true)
  })

  it('rejects attempts above max retries', () => {
    expect(JobSchema.safeParse({ ...base, attempts: 4 }).success).toBe(false)
  })

  it('parseJobDocument returns id with parsed fields', () => {
    const job = parseJobDocument('job-1', base)

    expect(job.id).toBe('job-1')
    expect(job.state).toBe('queued')
    expect(job.processingState).toBe('pending')
  })
})
