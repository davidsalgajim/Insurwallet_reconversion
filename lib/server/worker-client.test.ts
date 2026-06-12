import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  parseWorkerExtraction,
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

  it('validates worker HTTP response shape', () => {
    const parsed = WorkerProcessResponseSchema.parse({
      job_id: 'job-1',
      status: 'completed',
      message: 'ok',
      word_count: 120,
      pipeline_method: 'odl',
      pipeline_steps: ['odl', 'claude'],
      has_suspicious_content: false,
      extraction: {
        fields: { insurerName: 'Mapfre' },
        confidence: { insurerName: 'high' },
        method: 'odl',
        extractedAt: '2025-06-12T12:00:00.000Z',
      },
    })

    expect(parsed.extraction?.fields.insurerName).toBe('Mapfre')
  })
})
