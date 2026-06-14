import { FirebaseError } from 'firebase/app'
import { describe, expect, it } from 'vitest'
import { ZodError, z } from 'zod'

import {
  isProtectedPdfJobError,
  PROTECTED_PDF_ERROR_CODE,
  resolveUploadErrorKey,
} from './upload-errors'

describe('isProtectedPdfJobError', () => {
  it('detects stable worker error code', () => {
    expect(
      isProtectedPdfJobError(
        `Worker responded with 422: {"code":"${PROTECTED_PDF_ERROR_CODE}"}`
      )
    ).toBe(true)
  })

  it('detects Spanish user-facing message', () => {
    expect(
      isProtectedPdfJobError(
        'Este PDF está protegido con contraseña. Sube una copia sin protección.'
      )
    ).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isProtectedPdfJobError('WORKER_URL is not configured')).toBe(false)
    expect(isProtectedPdfJobError(null)).toBe(false)
  })
})

describe('resolveUploadErrorKey', () => {
  it('maps Firebase permission errors', () => {
    expect(
      resolveUploadErrorKey(
        new FirebaseError(
          'permission-denied',
          'Missing or insufficient permissions.'
        )
      )
    ).toBe('errors.permissionDenied')
  })

  it('maps storage unauthorized errors', () => {
    expect(
      resolveUploadErrorKey(
        new FirebaseError('storage/unauthorized', 'User is not authorized.')
      )
    ).toBe('errors.permissionDenied')
  })

  it('maps Zod validation failures', () => {
    const schema = z.object({ fileName: z.string().min(3) })
    const parsed = schema.safeParse({ fileName: 'a' })
    if (parsed.success) {
      throw new Error('expected validation failure')
    }
    expect(resolveUploadErrorKey(parsed.error)).toBe(
      'errors.invalidDocumentMetadata'
    )
    expect(resolveUploadErrorKey(new ZodError([]))).toBe(
      'errors.invalidDocumentMetadata'
    )
  })

  it('falls back to generic upload failure', () => {
    expect(resolveUploadErrorKey(new Error('something unexpected'))).toBe(
      'errors.uploadFailed'
    )
  })
})
