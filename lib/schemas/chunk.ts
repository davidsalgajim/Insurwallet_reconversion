import { z } from 'zod'

export const DocumentChunkSchema = z.object({
  text: z.string().min(1),
  page: z.number().int().positive().default(1),
  tokenCount: z.number().int().positive(),
  docId: z.string().min(1),
  fileName: z.string().optional(),
  /** Optional vector embedding for Firestore vector search (768-dim). */
  embedding: z.array(z.number()).length(768).optional(),
  indexedAt: z.coerce.date(),
})
export type DocumentChunk = z.infer<typeof DocumentChunkSchema>

export const BeneficiaryRecordSchema = z.object({
  name: z.string().min(1),
  pct: z.number().min(0).max(100),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type BeneficiaryRecord = z.infer<typeof BeneficiaryRecordSchema>
