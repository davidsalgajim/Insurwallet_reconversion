import { FirebaseError } from 'firebase/app'
import { ZodError } from 'zod'

export const PROTECTED_PDF_ERROR_CODE = 'PDF_ENCRYPTED'

export function isProtectedPdfJobError(error?: string | null): boolean {
  if (!error) {
    return false
  }

  const normalized = error.toLowerCase()
  return (
    error.includes(PROTECTED_PDF_ERROR_CODE) ||
    normalized.includes('password protected') ||
    normalized.includes('protegido con contraseña')
  )
}

/**
 * Maps upload pipeline failures to i18n keys under `policies.upload`.
 */
export function resolveUploadErrorKey(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
      case 'storage/unauthorized':
        return 'errors.permissionDenied'
      case 'storage/canceled':
        return 'errors.uploadCanceled'
      case 'storage/quota-exceeded':
        return 'errors.quotaExceeded'
      case 'unavailable':
      case 'storage/retry-limit-exceeded':
      case 'deadline-exceeded':
        return 'errors.networkError'
      default:
        break
    }
  }

  if (error instanceof ZodError) {
    return 'errors.invalidDocumentMetadata'
  }

  if (error instanceof Error) {
    const message = error.message

    if (/app check|app-check/i.test(message)) {
      return 'errors.appCheckRequired'
    }

    if (/invalid document metadata/i.test(message)) {
      return 'errors.invalidDocumentMetadata'
    }

    if (/failed to create processing job/i.test(message)) {
      return 'errors.processingJobFailed'
    }

    if (/network|fetch failed|failed to fetch/i.test(message)) {
      return 'errors.networkError'
    }
  }

  return 'errors.uploadFailed'
}
