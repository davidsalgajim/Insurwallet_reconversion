import { describe, expect, it } from 'vitest'

import {
  isJobProcessingSlow,
  isJobProcessingStale,
  JOB_SLOW_UI_MS,
  JOB_STALE_MS,
} from '@/lib/policies/job-processing-constants'

describe('job-processing-constants', () => {
  it('marks in-progress jobs as slow after the UI threshold', () => {
    const updatedAt = new Date(Date.now() - JOB_SLOW_UI_MS - 1_000)
    expect(isJobProcessingSlow('extracting', updatedAt)).toBe(true)
    expect(isJobProcessingSlow('pending', updatedAt)).toBe(true)
    expect(isJobProcessingSlow('ready', updatedAt)).toBe(false)
  })

  it('marks stale extracting jobs for retry', () => {
    const updatedAt = new Date(Date.now() - JOB_STALE_MS - 1_000)
    expect(isJobProcessingStale('extracting', updatedAt)).toBe(true)
    expect(isJobProcessingStale('analyzing', updatedAt)).toBe(true)
    expect(isJobProcessingStale('pending', updatedAt)).toBe(false)
  })
})
