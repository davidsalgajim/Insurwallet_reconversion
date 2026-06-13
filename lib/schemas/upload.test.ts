import { describe, expect, it } from 'vitest'

import {
  buildPolicyDocumentStoragePath,
  MAX_UPLOAD_BYTES,
  PolicyUploadFileSchema,
  validatePdfMagicBytes,
  validatePolicyUploadFile,
} from './upload'

function makePdfFile(name: string, size: number, content = '%PDF-1.4\n'): File {
  const body = content.padEnd(Math.max(size, content.length), '0')
  return new File([body.slice(0, size)], name, { type: 'application/pdf' })
}

describe('upload schema', () => {
  it('accepts valid PDF files under 20MB', () => {
    const file = makePdfFile('policy.pdf', 1024)
    expect(PolicyUploadFileSchema.safeParse(file).success).toBe(true)
  })

  it('rejects files over 20MB', () => {
    const file = makePdfFile('large.pdf', MAX_UPLOAD_BYTES + 1)
    expect(PolicyUploadFileSchema.safeParse(file).success).toBe(false)
  })

  it('rejects empty files', () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' })
    expect(PolicyUploadFileSchema.safeParse(file).success).toBe(false)
  })

  it('validates PDF magic bytes', async () => {
    const valid = makePdfFile('ok.pdf', 64)
    const invalid = new File(['not-a-pdf'], 'bad.pdf', {
      type: 'application/pdf',
    })

    expect(await validatePdfMagicBytes(valid)).toBe(true)
    expect(await validatePdfMagicBytes(invalid)).toBe(false)
  })

  it('validatePolicyUploadFile returns error for non-PDF content', async () => {
    const file = new File(['hello'], 'fake.pdf', { type: 'application/pdf' })
    const result = await validatePolicyUploadFile(file)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorKey).toBe('errors.invalidPdf')
    }
  })

  it('accepts JPEG images from mobile camera capture', async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'scan.jpg', {
      type: 'image/jpeg',
    })
    const result = await validatePolicyUploadFile(file)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.mimeType).toBe('image/jpeg')
    }
  })

  it('builds storage path under users/{uid}/policies/{policyId}/docs/{docId}', () => {
    expect(
      buildPolicyDocumentStoragePath('uid-1', 'pol-1', 'doc-1', 'My Policy.pdf')
    ).toBe('users/uid-1/policies/pol-1/docs/doc-1/My Policy.pdf')
  })
})
