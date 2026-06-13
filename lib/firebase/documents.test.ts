import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { documentToFirestoreData } from '@/lib/firebase/documents'
import { PDF_MIME_TYPE } from '@/lib/schemas/upload'

describe('documentToFirestoreData', () => {
  it('serializes upload metadata with pending processing state', () => {
    const now = new Date('2025-06-01T12:00:00.000Z')
    const data = documentToFirestoreData(
      {
        policyId: 'pol-1',
        docId: 'doc-1',
        fileName: 'policy.pdf',
        storagePath: 'users/u/policies/pol-1/docs/doc-1/policy.pdf',
        fileSize: 1024,
        mimeType: PDF_MIME_TYPE,
      },
      now
    )

    expect(data.fileName).toBe('policy.pdf')
    expect(data.category).toBe('cover')
    expect(data.storagePath).toBe(
      'users/u/policies/pol-1/docs/doc-1/policy.pdf'
    )
    expect(data.fileSize).toBe(1024)
    expect(data.mimeType).toBe(PDF_MIME_TYPE)
    expect(data.processing).toEqual({ state: 'pending' })
    expect(data.createdAt).toBeInstanceOf(Timestamp)
    expect((data.createdAt as Timestamp).toDate()).toEqual(now)
  })
})
