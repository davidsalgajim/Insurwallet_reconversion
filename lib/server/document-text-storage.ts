import { getAdminStorage } from '@/lib/firebase/admin'

/** Matches PolicyDocumentSchema.extractedSummary max length. */
export const EXTRACTED_SUMMARY_MAX_CHARS = 10_000

const EXTRACTED_TEXT_FILE = 'extracted/document.txt'

/** `users/{uid}/policies/{policyId}/docs/{docId}/extracted/document.txt` */
export function buildExtractedTextStoragePath(pdfStoragePath: string): string {
  const normalized = pdfStoragePath.replace(/\\/g, '/').trim()
  const lastSlash = normalized.lastIndexOf('/')
  if (lastSlash <= 0) {
    throw new Error('Invalid policy document storage path')
  }

  const docDir = normalized.slice(0, lastSlash)
  return `${docDir}/${EXTRACTED_TEXT_FILE}`
}

function resolveStorageBucketName(): string {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()

  if (!bucket) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not configured')
  }

  return bucket
}

export type PersistedDocumentText = {
  extractedSummary: string
  extractedTextPath?: string
  ragWordCount: number
}

export async function downloadExtractedDocumentText(
  storagePath: string
): Promise<string> {
  const bucket = getAdminStorage().bucket(resolveStorageBucketName())
  const file = bucket.file(storagePath)
  const [exists] = await file.exists()
  if (!exists) {
    return ''
  }

  const [buffer] = await file.download()
  return buffer.toString('utf8')
}

export async function persistExtractedDocumentText(input: {
  pdfStoragePath: string
  text: string
}): Promise<PersistedDocumentText | null> {
  const normalized = input.text.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return null
  }

  const ragWordCount = normalized.split(/\s+/).filter(Boolean).length
  const extractedSummary = normalized.slice(0, EXTRACTED_SUMMARY_MAX_CHARS)

  if (normalized.length <= EXTRACTED_SUMMARY_MAX_CHARS) {
    return {
      extractedSummary,
      ragWordCount,
    }
  }

  const extractedTextPath = buildExtractedTextStoragePath(input.pdfStoragePath)
  const bucket = getAdminStorage().bucket(resolveStorageBucketName())
  await bucket.file(extractedTextPath).save(normalized, {
    contentType: 'text/plain; charset=utf-8',
    metadata: {
      cacheControl: 'private, max-age=3600',
    },
  })

  return {
    extractedSummary,
    extractedTextPath,
    ragWordCount,
  }
}

export async function resolveDocumentRagText(input: {
  extractedSummary?: string
  extractedTextPath?: string
}): Promise<string> {
  if (input.extractedTextPath) {
    const full = await downloadExtractedDocumentText(input.extractedTextPath)
    if (full.trim()) {
      return full.trim()
    }
  }

  return typeof input.extractedSummary === 'string'
    ? input.extractedSummary.trim()
    : ''
}
