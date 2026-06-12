import { z } from 'zod'

import {
  PolicyExtractionSchema,
  type PolicyExtraction,
} from '@/lib/schemas/extraction'

export type WorkerExtractionPayload = {
  fields: Record<string, unknown>
  confidence: Record<string, string>
  method: string
  extractedAt: string
}

export type WorkerProcessResponse = {
  job_id: string
  status: string
  message: string
  word_count: number
  pipeline_method: string
  pipeline_steps?: string[]
  has_suspicious_content: boolean
  extraction?: WorkerExtractionPayload | null
}

const WorkerExtractionPayloadSchema = z.object({
  fields: z.record(z.unknown()),
  confidence: z.record(z.string()),
  method: z.string(),
  extractedAt: z.string(),
})

export const WorkerProcessResponseSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  message: z.string(),
  word_count: z.number(),
  pipeline_method: z.string(),
  pipeline_steps: z.array(z.string()).optional(),
  has_suspicious_content: z.boolean(),
  extraction: WorkerExtractionPayloadSchema.nullable().optional(),
})

export function parseWorkerExtraction(
  payload: WorkerExtractionPayload
): PolicyExtraction {
  const method = ['odl', 'surya', 'markitdown'].includes(payload.method)
    ? (payload.method as PolicyExtraction['method'])
    : 'odl'

  return PolicyExtractionSchema.parse({
    fields: payload.fields,
    confidence: payload.confidence,
    method,
    extractedAt: payload.extractedAt,
  })
}

export async function invokeWorkerProcessJob(input: {
  jobId: string
  storagePath: string
  mimeType?: string
}): Promise<WorkerProcessResponse | null> {
  const workerUrl = process.env.WORKER_URL?.trim()

  if (!workerUrl) {
    return null
  }

  const endpoint = `${workerUrl.replace(/\/$/, '')}/jobs/process`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const internalSecret = process.env.INTERNAL_API_SECRET?.trim()
  if (internalSecret) {
    headers.Authorization = `Bearer ${internalSecret}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      job_id: input.jobId,
      storage_path: input.storagePath,
      mime_type: input.mimeType ?? 'application/pdf',
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Worker responded with ${response.status}${detail ? `: ${detail}` : ''}`
    )
  }

  const json = (await response.json()) as unknown
  return WorkerProcessResponseSchema.parse(json)
}

const BACKOFF_MS = [1_000, 3_000, 9_000] as const
const MAX_WORKER_ATTEMPTS = 3

export async function invokeWorkerWithRetries(input: {
  jobId: string
  storagePath: string
  mimeType?: string
}): Promise<WorkerProcessResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_WORKER_ATTEMPTS; attempt += 1) {
    try {
      const result = await invokeWorkerProcessJob(input)
      if (!result) {
        throw new Error('WORKER_URL is not configured')
      }
      if (result.status !== 'completed' || !result.extraction) {
        throw new Error(result.message || 'Worker returned no extraction')
      }
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < MAX_WORKER_ATTEMPTS - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, BACKOFF_MS[attempt] ?? 9_000)
        )
      }
    }
  }

  throw lastError ?? new Error('Worker processing failed')
}

export const USER_FACING_JOB_ERRORS = {
  workerUnavailable:
    'No pudimos analizar tu documento. Verifica tu conexión e inténtalo de nuevo.',
  extractionFailed:
    'No pudimos extraer los datos de la póliza. Revisa que el PDF sea legible o ingresa los datos manualmente.',
  policyNotFound: 'No encontramos la póliza asociada a este documento.',
  generic: 'Ocurrió un error al procesar el documento. Inténtalo más tarde.',
} as const
