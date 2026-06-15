import { z } from 'zod'

import { isProtectedPdfJobError } from '@/lib/policies/upload-errors'
import {
  PolicyExtractionSchema,
  type PolicyExtraction,
} from '@/lib/schemas/extraction'
import { PipelineMethodSchema, type PipelineMethod } from '@/lib/schemas/job'

export type WorkerExtractionPayload = {
  fields: Record<string, unknown>
  confidence: Record<string, string>
  bboxes?: Record<string, FieldBboxPayload> | null
  method: string
  extractedAt: string
}

export type FieldBboxPayload = {
  page: number
  left: number
  top: number
  width: number
  height: number
}

export type WorkerProcessResponse = {
  job_id: string
  status: string
  message: string
  word_count: number
  rag_word_count?: number
  pipeline_method: string
  pipeline_steps?: string[]
  has_suspicious_content: boolean
  document_text?: string
  extraction?: WorkerExtractionPayload | null
}

const FieldBboxPayloadSchema = z.object({
  page: z.number().int().positive(),
  left: z.number().min(0).max(1),
  top: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
})

const WorkerExtractionPayloadSchema = z.object({
  fields: z.record(z.unknown()),
  confidence: z.record(z.string()),
  bboxes: z.record(FieldBboxPayloadSchema).nullish(),
  method: z.string(),
  extractedAt: z.string(),
})

export const WorkerProcessResponseSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  message: z.string(),
  word_count: z.number(),
  rag_word_count: z.number().optional(),
  pipeline_method: z.string(),
  pipeline_steps: z.array(z.string()).optional(),
  has_suspicious_content: z.boolean(),
  document_text: z.string().optional(),
  extraction: WorkerExtractionPayloadSchema.nullable().optional(),
})

/** Normalizes worker `pipeline_steps` to the Job schema enum (see PipelineMethodSchema). */
export function parseWorkerPipelineSteps(
  steps: string[] | undefined,
  fallback: PipelineMethod | PolicyExtraction['method']
): PipelineMethod[] {
  const resolvedFallback: PipelineMethod =
    fallback === 'stub' || !PipelineMethodSchema.safeParse(fallback).success
      ? 'odl'
      : fallback

  if (!steps?.length) {
    return [resolvedFallback]
  }

  const parsed = z.array(PipelineMethodSchema).safeParse(steps)
  if (parsed.success) {
    return parsed.data
  }

  const valid = steps.filter(
    (step): step is PipelineMethod =>
      PipelineMethodSchema.safeParse(step).success
  )
  return valid.length > 0 ? valid : [resolvedFallback]
}

export function parseWorkerExtraction(
  payload: WorkerExtractionPayload
): PolicyExtraction {
  const method = ['odl', 'surya', 'markitdown'].includes(payload.method)
    ? (payload.method as PolicyExtraction['method'])
    : 'odl'

  return PolicyExtractionSchema.parse({
    fields: payload.fields,
    confidence: payload.confidence,
    bboxes: payload.bboxes ?? undefined,
    method,
    extractedAt: payload.extractedAt,
  })
}

async function buildWorkerAuthHeaders(
  workerUrl: string
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const internalSecret = process.env.INTERNAL_API_SECRET?.trim()
  const hasGoogleCreds = Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
    process.env.GCLOUD_PROJECT?.trim()
  )

  const isLocalWorker = (() => {
    try {
      const host = new URL(workerUrl).hostname
      return host === 'localhost' || host === '127.0.0.1'
    } catch {
      return false
    }
  })()

  if (internalSecret && (isLocalWorker || !hasGoogleCreds)) {
    headers.Authorization = `Bearer ${internalSecret}`
    return headers
  }

  try {
    const { GoogleAuth } = await import('google-auth-library')
    const auth = new GoogleAuth()
    const client = await auth.getIdTokenClient(workerUrl)
    const token = await client.idTokenProvider.fetchIdToken(workerUrl)
    headers.Authorization = `Bearer ${token}`
    return headers
  } catch {
    if (internalSecret) {
      headers.Authorization = `Bearer ${internalSecret}`
    }
    return headers
  }
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
  const headers = await buildWorkerAuthHeaders(workerUrl)

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

export type WorkerErrorCode =
  | 'WORKER_NOT_CONFIGURED'
  | 'WORKER_UNREACHABLE'
  | 'WORKER_AUTH_FAILED'
  | 'WORKER_UNAVAILABLE'
  | 'EXTRACTION_FAILED'
  | 'PROTECTED_PDF'

export class WorkerProcessError extends Error {
  readonly code: WorkerErrorCode
  readonly httpStatus: number
  readonly devHint?: string

  constructor(options: {
    code: WorkerErrorCode
    message: string
    httpStatus?: number
    devHint?: string
  }) {
    super(options.message)
    this.name = 'WorkerProcessError'
    this.code = options.code
    this.httpStatus = options.httpStatus ?? 500
    this.devHint = options.devHint
  }
}

function isWorkerConnectionError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('connect timeout') ||
    lower.includes('socket hang up') ||
    lower.includes('other side closed')
  )
}

function isWorkerAuthError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    message.includes('401') ||
    lower.includes('invalid bearer token') ||
    lower.includes('missing bearer token') ||
    lower.includes('unauthorized')
  )
}

export function classifyWorkerFailure(error: unknown): WorkerProcessError {
  if (error instanceof WorkerProcessError) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)

  if (isProtectedPdfJobError(message)) {
    return new WorkerProcessError({
      code: 'PROTECTED_PDF',
      message: USER_FACING_JOB_ERRORS.protectedPdf,
      httpStatus: 422,
    })
  }

  if (message.includes('WORKER_URL')) {
    return new WorkerProcessError({
      code: 'WORKER_NOT_CONFIGURED',
      message: USER_FACING_JOB_ERRORS.workerUnavailable,
      httpStatus: 503,
      devHint:
        'Set WORKER_URL=http://localhost:8080 in .env.local (see .env.example).',
    })
  }

  if (isWorkerConnectionError(message)) {
    return new WorkerProcessError({
      code: 'WORKER_UNREACHABLE',
      message: USER_FACING_JOB_ERRORS.workerUnavailable,
      httpStatus: 503,
      devHint:
        'Start the document worker: cd worker && uvicorn main:app --reload --port 8080',
    })
  }

  if (isWorkerAuthError(message)) {
    return new WorkerProcessError({
      code: 'WORKER_AUTH_FAILED',
      message: USER_FACING_JOB_ERRORS.workerUnavailable,
      httpStatus: 503,
      devHint:
        'Set the same INTERNAL_API_SECRET (min 16 chars) in .env.local and the worker shell.',
    })
  }

  if (
    message.includes('503') ||
    message.includes('OIDC audience is not configured')
  ) {
    return new WorkerProcessError({
      code: 'WORKER_UNAVAILABLE',
      message: USER_FACING_JOB_ERRORS.workerUnavailable,
      httpStatus: 503,
    })
  }

  return new WorkerProcessError({
    code: 'EXTRACTION_FAILED',
    message: USER_FACING_JOB_ERRORS.extractionFailed,
    httpStatus: 500,
  })
}

/** @deprecated Use classifyWorkerFailure(error).message */
export function mapWorkerFailureMessage(error: unknown): string {
  return classifyWorkerFailure(error).message
}

function shouldRetryWorkerInvocation(error: Error, attempt: number): boolean {
  if (attempt >= MAX_WORKER_ATTEMPTS - 1) {
    return false
  }

  const classified = classifyWorkerFailure(error)
  return (
    classified.code !== 'WORKER_NOT_CONFIGURED' &&
    classified.code !== 'WORKER_UNREACHABLE' &&
    classified.code !== 'WORKER_AUTH_FAILED'
  )
}

const BACKOFF_MS = [1_000, 3_000, 9_000] as const
const MAX_WORKER_ATTEMPTS = 3

export async function invokeWorkerWithRetries(input: {
  jobId: string
  storagePath: string
  mimeType?: string
}): Promise<WorkerProcessResponse> {
  if (!process.env.WORKER_URL?.trim()) {
    throw classifyWorkerFailure(new Error('WORKER_URL is not configured'))
  }

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
      if (!shouldRetryWorkerInvocation(lastError, attempt)) {
        break
      }
      await new Promise((resolve) =>
        setTimeout(resolve, BACKOFF_MS[attempt] ?? 9_000)
      )
    }
  }

  throw classifyWorkerFailure(
    lastError ?? new Error('Worker processing failed')
  )
}

export const USER_FACING_JOB_ERRORS = {
  workerUnavailable:
    'No pudimos analizar tu documento. Verifica tu conexión e inténtalo de nuevo.',
  extractionFailed:
    'No pudimos extraer los datos de la póliza. Revisa que el PDF sea legible o ingresa los datos manualmente.',
  protectedPdf:
    'Este PDF está protegido con contraseña. Sube una copia sin protección.',
  policyNotFound: 'No encontramos la póliza asociada a este documento.',
  generic: 'Ocurrió un error al procesar el documento. Inténtalo más tarde.',
} as const
