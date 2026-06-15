import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  classifyWorkerFailure,
  invokeWorkerWithRetries,
  parseWorkerExtraction,
  parseWorkerPipelineSteps,
  WorkerProcessResponseSchema,
} from '@/lib/server/worker-client'

describe('worker-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('parses worker extraction into PolicyExtraction schema', () => {
    const extraction = parseWorkerExtraction({
      fields: {
        insurerName: 'Sura',
        policyNumber: 'POL-99',
        holderName: 'Ana Test',
        premium: 1000,
        currency: 'COP',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      },
      confidence: {
        insurerName: 'high',
        policyNumber: 'high',
        holderName: 'medium',
        premium: 'medium',
      },
      method: 'odl',
      extractedAt: '2025-06-12T12:00:00.000Z',
    })

    expect(extraction.fields.insurerName).toBe('Sura')
    expect(extraction.method).toBe('odl')
    expect(extraction.confidence.holderName).toBe('medium')
  })

  it('parses worker extraction with bboxes into PolicyExtraction schema', () => {
    const extraction = parseWorkerExtraction({
      fields: {
        insurerName: 'Sura',
        policyNumber: 'POL-99',
      },
      confidence: {
        insurerName: 'high',
        policyNumber: 'high',
      },
      bboxes: {
        insurerName: {
          page: 1,
          left: 0.1,
          top: 0.2,
          width: 0.3,
          height: 0.04,
        },
      },
      method: 'odl',
      extractedAt: '2025-06-12T12:00:00.000Z',
    })

    expect(extraction.bboxes?.insurerName?.page).toBe(1)
    expect(extraction.method).toBe('odl')
  })

  it('validates worker HTTP response shape', () => {
    const parsed = WorkerProcessResponseSchema.parse({
      job_id: 'job-1',
      status: 'completed',
      message: 'ok',
      word_count: 120,
      rag_word_count: 2400,
      pipeline_method: 'odl',
      pipeline_steps: ['vision', 'claude', 'transcribe'],
      has_suspicious_content: false,
      document_text: '--- Page 1 ---\nExclusión por deportes extremos.',
      extraction: {
        fields: { insurerName: 'Mapfre' },
        confidence: { insurerName: 'high' },
        method: 'odl',
        extractedAt: '2025-06-12T12:00:00.000Z',
      },
    })

    expect(parsed.extraction?.fields.insurerName).toBe('Mapfre')
    expect(parsed.document_text).toContain('Exclusión')
    expect(parsed.rag_word_count).toBe(2400)
    expect(parseWorkerPipelineSteps(parsed.pipeline_steps, 'odl')).toEqual([
      'vision',
      'claude',
      'transcribe',
    ])
  })

  it('accepts null bboxes from worker extraction payload', () => {
    const parsed = WorkerProcessResponseSchema.parse({
      job_id: 'job-2',
      status: 'completed',
      message: 'ok',
      word_count: 388,
      pipeline_method: 'surya',
      pipeline_steps: ['surya', 'claude'],
      has_suspicious_content: false,
      extraction: {
        fields: { insurerName: 'Zurich' },
        confidence: { insurerName: 'high' },
        bboxes: null,
        method: 'surya',
        extractedAt: '2026-06-14T15:07:48.786495+00:00',
      },
    })

    const extraction = parseWorkerExtraction(parsed.extraction!)
    expect(extraction.fields.insurerName).toBe('Zurich')
    expect(extraction.bboxes).toBeUndefined()
  })

  it('parseWorkerPipelineSteps falls back when steps are empty', () => {
    expect(parseWorkerPipelineSteps(undefined, 'surya')).toEqual(['surya'])
    expect(parseWorkerPipelineSteps([], 'odl')).toEqual(['odl'])
  })

  it('parseWorkerPipelineSteps drops unknown steps and keeps valid ones', () => {
    expect(
      parseWorkerPipelineSteps(['vision', 'claude', 'unknown-step'], 'odl')
    ).toEqual(['vision', 'claude'])
  })

  it('classifies missing WORKER_URL as 503 with dev hint', () => {
    const err = classifyWorkerFailure(new Error('WORKER_URL is not configured'))
    expect(err.code).toBe('WORKER_NOT_CONFIGURED')
    expect(err.httpStatus).toBe(503)
    expect(err.devHint).toContain('WORKER_URL')
  })

  it('classifies connection failures as worker unreachable', () => {
    const err = classifyWorkerFailure(new TypeError('fetch failed'))
    expect(err.code).toBe('WORKER_UNREACHABLE')
    expect(err.httpStatus).toBe(503)
    expect(err.devHint).toContain('uvicorn')
  })

  it('classifies worker 401 as auth failure', () => {
    const err = classifyWorkerFailure(
      new Error('Worker responded with 401: Invalid Bearer token')
    )
    expect(err.code).toBe('WORKER_AUTH_FAILED')
    expect(err.httpStatus).toBe(503)
    expect(err.devHint).toContain('INTERNAL_API_SECRET')
  })

  it('fails fast when WORKER_URL is unset', async () => {
    const previous = process.env.WORKER_URL
    delete process.env.WORKER_URL

    await expect(
      invokeWorkerWithRetries({
        jobId: 'job-fast-fail',
        storagePath: 'users/u/policies/p/docs/d/file.pdf',
      })
    ).rejects.toMatchObject({ code: 'WORKER_NOT_CONFIGURED', httpStatus: 503 })

    process.env.WORKER_URL = previous
  })

  it('does not retry when worker is unreachable', async () => {
    const previous = process.env.WORKER_URL
    process.env.WORKER_URL = 'http://127.0.0.1:9'

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      invokeWorkerWithRetries({
        jobId: 'job-no-retry',
        storagePath: 'users/u/policies/p/docs/d/file.pdf',
      })
    ).rejects.toMatchObject({ code: 'WORKER_UNREACHABLE' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    fetchSpy.mockRestore()
    process.env.WORKER_URL = previous
  })
})
