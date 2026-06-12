'use client'

type SentryLike = {
  captureException: (error: unknown) => void
  captureMessage: (message: string) => void
}

const noopSentry: SentryLike = {
  captureException: () => {},
  captureMessage: () => {},
}

let sentryClient: SentryLike = noopSentry

/**
 * Initializes Sentry in the browser when NEXT_PUBLIC_SENTRY_DSN is set.
 * Stub-safe: no @sentry/nextjs dependency until F7 wiring is complete.
 */
export function initSentryClient(): SentryLike {
  if (typeof window === 'undefined') {
    return noopSentry
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    return noopSentry
  }

  if (sentryClient !== noopSentry) {
    return sentryClient
  }

  // TODO 7.1: replace with @sentry/nextjs init({ dsn, tracesSampleRate, ... })
  if (process.env.NODE_ENV === 'development') {
    console.info('[observability] Sentry client stub active (DSN configured)')
  }

  sentryClient = {
    captureException: (error) => {
      console.error('[sentry stub] captureException', error)
    },
    captureMessage: (message) => {
      console.warn('[sentry stub] captureMessage', message)
    },
  }

  return sentryClient
}

export function getSentryClient(): SentryLike {
  return sentryClient
}
