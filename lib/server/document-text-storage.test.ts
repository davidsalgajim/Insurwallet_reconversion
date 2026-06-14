import { describe, expect, it } from 'vitest'

import {
  buildExtractedTextStoragePath,
  EXTRACTED_SUMMARY_MAX_CHARS,
} from '@/lib/server/document-text-storage'

describe('document-text-storage', () => {
  it('builds extracted text path under document folder', () => {
    expect(
      buildExtractedTextStoragePath(
        'users/uid-1/policies/pol-1/docs/doc-1/policy.pdf'
      )
    ).toBe('users/uid-1/policies/pol-1/docs/doc-1/extracted/document.txt')
  })

  it('summary max matches Firestore schema', () => {
    expect(EXTRACTED_SUMMARY_MAX_CHARS).toBe(10_000)
  })
})
