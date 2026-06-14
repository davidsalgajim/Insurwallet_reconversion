import { z } from 'zod'

import { ProcessingStateSchema } from '@/lib/schemas/document'

export const JobStateSchema = z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
])
export type JobState = z.infer<typeof JobStateSchema>

export const PipelineMethodSchema = z.enum([
  'odl',
  'surya',
  'markitdown',
  'claude',
  'vision',
])
export type PipelineMethod = z.infer<typeof PipelineMethodSchema>

export const JobTimingsSchema = z
  .object({
    queuedMs: z.number().nonnegative().optional(),
    extractMs: z.number().nonnegative().optional(),
    analyzeMs: z.number().nonnegative().optional(),
    totalMs: z.number().nonnegative().optional(),
  })
  .optional()
export type JobTimings = z.infer<typeof JobTimingsSchema>

export const JobSchema = z.object({
  ownerUid: z.string().min(1),
  policyId: z.string().min(1),
  docId: z.string().min(1),
  storagePath: z.string().min(1),
  state: JobStateSchema,
  processingState: ProcessingStateSchema,
  attempts: z.number().int().min(0).max(3),
  pipeline: z.array(PipelineMethodSchema).min(1).optional(),
  error: z.string().optional(),
  timings: JobTimingsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Job = z.infer<typeof JobSchema>

export type JobDocument = Job & { id: string }

export function parseJobDocument(
  id: string,
  data: Record<string, unknown>
): JobDocument {
  return { id, ...JobSchema.parse(data) }
}
