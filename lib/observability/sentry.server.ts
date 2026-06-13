import * as Sentry from '@sentry/nextjs'

type SentryLike = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  captureMessage: (message: string, context?: Record<string, unknown>) => void
}

const noopSentry: SentryLike = {
  captureException: () => {},
  captureMessage: () => {},
}

let sentryServer: SentryLike = noopSentry
let initialized = false

/**
 * Initializes Sentry on the server when NEXT_PUBLIC_SENTRY_DSN is set.
 * No-op without DSN — safe for local dev and CI.
 */
export function initSentryServer(): SentryLike {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN
  if (!dsn) {
    return noopSentry
  }

  if (initialized) {
    return sentryServer
  }

  Sentry.init({
    dsn,
    enabled: true,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  })

  sentryServer = {
    captureException: (error, context) => {
      Sentry.captureException(error, context ? { extra: context } : undefined)
    },
    captureMessage: (message, context) => {
      Sentry.captureMessage(message, context ? { extra: context } : undefined)
    },
  }

  initialized = true
  return sentryServer
}

export function getSentryServer(): SentryLike {
  if (!initialized) {
    return initSentryServer()
  }

  return sentryServer
}
