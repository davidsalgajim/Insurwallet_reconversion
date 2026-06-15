/** Per-request timeout when Next.js calls the document worker (vision+Claude can take 2–5 min). */
export const WORKER_REQUEST_TIMEOUT_MS = 300_000

/** Wall-clock cap for a single document job worker invocation. */
export const JOB_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000

/** In-progress jobs older than this are considered stale (retry / fail). */
export const JOB_STALE_MS = 8 * 60 * 1000

/** UI hint when processing exceeds this duration. */
export const JOB_SLOW_UI_MS = 3 * 60 * 1000

export function isJobProcessingStale(
  processingState: string,
  updatedAt: Date,
  now: Date = new Date()
): boolean {
  if (processingState !== 'extracting' && processingState !== 'analyzing') {
    return false
  }

  return now.getTime() - updatedAt.getTime() > JOB_STALE_MS
}

export function isJobProcessingSlow(
  processingState: string,
  updatedAt: Date,
  now: Date = new Date()
): boolean {
  if (processingState === 'ready' || processingState === 'failed') {
    return false
  }

  return now.getTime() - updatedAt.getTime() > JOB_SLOW_UI_MS
}
