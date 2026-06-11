import { z } from 'zod'

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
  method: z.enum(['odl', 'surya', 'markitdown']).optional(),
  error: z.string().optional(),
})
export type DocumentProcessing = z.infer<typeof DocumentProcessingSchema>

export const PolicyDocumentSchema = z.object({
  fileName: z.string().min(1),
  category: DocumentCategorySchema,
  storagePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  processing: DocumentProcessingSchema,
  extractedTextPath: z.string().min(1).optional(),
  extractedSummary: z.string().max(10_000).optional(),
  createdAt: z.coerce.date(),
})
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>
