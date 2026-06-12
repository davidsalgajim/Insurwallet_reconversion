import { z } from 'zod'

import { PDF_MIME_TYPE } from '@/lib/schemas/upload'

/** users/{uid}/policies/{policyId}/docs/{docId}/{fileName} */
export const POLICY_DOCUMENT_STORAGE_PATH_PATTERN =
  /^users\/[^/]+\/policies\/[^/]+\/docs\/[^/]+\/[^/]+$/

export function isValidPolicyDocumentStoragePath(
  storagePath: string,
  ownerUid: string,
  policyId: string,
  docId: string
): boolean {
  const expectedPrefix = `users/${ownerUid}/policies/${policyId}/docs/${docId}/`
  return (
    POLICY_DOCUMENT_STORAGE_PATH_PATTERN.test(storagePath) &&
    storagePath.startsWith(expectedPrefix) &&
    storagePath.length > expectedPrefix.length
  )
}

export const DocumentCategorySchema = z.enum([
  'cover',
  'clausulado',
  'benefits',
  'receipt',
  'claim',
  'endorsement',
  'other',
])
export type DocumentCategory = z.infer<typeof DocumentCategorySchema>

export const ProcessingStateSchema = z.enum([
  'pending',
  'extracting',
  'analyzing',
  'ready',
  'failed',
])
export type ProcessingState = z.infer<typeof ProcessingStateSchema>

export const DocumentProcessingSchema = z.object({
  state: ProcessingStateSchema,
  jobId: z.string().min(1).optional(),
  method: z.enum(['odl', 'surya', 'markitdown']).optional(),
  error: z.string().optional(),
})
export type DocumentProcessing = z.infer<typeof DocumentProcessingSchema>

export const PolicyDocumentSchema = z.object({
  fileName: z.string().min(1),
  category: DocumentCategorySchema,
  storagePath: z.string().min(1).regex(POLICY_DOCUMENT_STORAGE_PATH_PATTERN),
  fileSize: z.number().int().positive(),
  mimeType: z.literal(PDF_MIME_TYPE),
  processing: DocumentProcessingSchema,
  extractedTextPath: z.string().min(1).optional(),
  extractedSummary: z.string().max(10_000).optional(),
  createdAt: z.coerce.date(),
})
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>
