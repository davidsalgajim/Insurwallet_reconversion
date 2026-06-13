import { describe, expect, it } from 'vitest'

import { MAX_UPLOAD_BYTES } from '@/lib/schemas/upload'
import { compressPolicyUploadFile } from '@/lib/utils/document-compression'

describe('document compression', () => {
  it('passes through files already under 2MB', async () => {
    const file = new File(['hello'], 'small.txt', { type: 'image/jpeg' })
    const result = await compressPolicyUploadFile(file, 'image/jpeg')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.compressed).toBe(false)
      expect(result.file.size).toBeLessThanOrEqual(MAX_UPLOAD_BYTES)
    }
  })
})
