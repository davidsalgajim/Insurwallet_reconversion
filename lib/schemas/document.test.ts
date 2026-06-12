import { describe, expect, it } from 'vitest'

import {
  PolicyDocumentSchema,
  isValidPolicyDocumentStoragePath,
} from '@/lib/schemas/document'
import { PDF_MIME_TYPE } from '@/lib/schemas/upload'

describe('PolicyDocumentSchema storagePath', () => {
  const base = {
    fileName: 'policy.pdf',
    category: 'cover' as const,
    fileSize: 1024,
    mimeType: PDF_MIME_TYPE,
    processing: { state: 'pending' as const },
    createdAt: new Date('2025-06-01T12:00:00.000Z'),
  }

  it('accepts canonical users/{uid}/policies/{policyId}/docs/{docId}/{fileName}', () => {
    const storagePath = 'users/owner-1/policies/policy-1/docs/doc-1/policy.pdf'

    expect(
      PolicyDocumentSchema.safeParse({ ...base, storagePath }).success
    ).toBe(true)
    expect(
      isValidPolicyDocumentStoragePath(
        storagePath,
        'owner-1',
        'policy-1',
        'doc-1'
      )
    ).toBe(true)
  })

  it('rejects paths outside the documents layout', () => {
    expect(
      PolicyDocumentSchema.safeParse({
        ...base,
        storagePath: 'users/owner-1/evil.pdf',
      }).success
    ).toBe(false)
    expect(
      isValidPolicyDocumentStoragePath(
        'users/owner-1/policies/policy-1/docs/doc-1/policy.pdf',
        'other-owner',
        'policy-1',
        'doc-1'
      )
    ).toBe(false)
  })
})
