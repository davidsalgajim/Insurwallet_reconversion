'use client'

import * as Sentry from '@sentry/nextjs'

type SentryLike = {
  captureException: (error: unknown) => void
  captureMessage: (message: string) => void
}

const noopSentry: SentryLike = {
  captureException: () => {},
  captureMessage: () => {},
}

let sentryClient: SentryLike = noopSentry
let initialized = false

/**
 * Initializes Sentry in the browser when NEXT_PUBLIC_SENTRY_DSN is set.
 * No-op without DSN — safe for local dev and CI.
 */
export function initSentryClient(): SentryLike {
  if (typeof window === 'undefined') {
    return noopSentry
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    return noopSentry
  }

  if (initialized) {
    return sentryClient
  }

  Sentry.init({
    dsn,
    enabled: true,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })

  sentryClient = {
    captureException: (error) => {
      Sentry.captureException(error)
    },
    captureMessage: (message) => {
      Sentry.captureMessage(message)
    },
  }

  initialized = true
  return sentryClient
}

export function getSentryClient(): SentryLike {
  return sentryClient
}
