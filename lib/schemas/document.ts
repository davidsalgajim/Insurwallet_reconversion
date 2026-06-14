import { z } from 'zod'

import { PolicyExtractionSchema } from '@/lib/schemas/extraction'
import { POLICY_UPLOAD_MIME_TYPES } from '@/lib/schemas/upload'

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

/** Optional user-facing role for multi-document uploads (carátula, condicionado, etc.) */
export const DocumentRoleSchema = z.enum([
  'cover',
  'conditions',
  'endorsement',
  'renewal',
  'other',
])
export type DocumentRole = z.infer<typeof DocumentRoleSchema>

export function documentRoleToCategory(role: DocumentRole): DocumentCategory {
  switch (role) {
    case 'cover':
      return 'cover'
    case 'conditions':
      return 'clausulado'
    case 'endorsement':
      return 'endorsement'
    case 'renewal':
      return 'cover'
    default:
      return 'other'
  }
}

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
  documentRole: DocumentRoleSchema.optional(),
  storagePath: z.string().min(1).regex(POLICY_DOCUMENT_STORAGE_PATH_PATTERN),
  fileSize: z.number().int().positive(),
  mimeType: z.enum(POLICY_UPLOAD_MIME_TYPES),
  processing: DocumentProcessingSchema,
  extraction: PolicyExtractionSchema.optional(),
  extractedTextPath: z.string().min(1).optional(),
  extractedSummary: z.string().max(10_000).optional(),
  createdAt: z.coerce.date(),
})
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>
