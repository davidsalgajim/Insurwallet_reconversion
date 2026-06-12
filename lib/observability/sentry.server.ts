type SentryLike = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  captureMessage: (message: string, context?: Record<string, unknown>) => void
}

const noopSentry: SentryLike = {
  captureException: () => {},
  captureMessage: () => {},
}

let sentryServer: SentryLike = noopSentry

/**
 * Initializes Sentry on the server when NEXT_PUBLIC_SENTRY_DSN is set.
 * Stub-safe: no @sentry/nextjs dependency until F7 wiring is complete.
 */
export function initSentryServer(): SentryLike {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN
  if (!dsn) {
    return noopSentry
  }

  if (sentryServer !== noopSentry) {
    return sentryServer
  }

  // TODO 7.1: replace with @sentry/nextjs server init + source maps on deploy
  sentryServer = {
    captureException: (error, context) => {
      console.error('[sentry stub] captureException', { error, context })
    },
    captureMessage: (message, context) => {
      console.warn('[sentry stub] captureMessage', { message, context })
    },
  }

  return sentryServer
}

export function getSentryServer(): SentryLike {
  if (sentryServer === noopSentry) {
    return initSentryServer()
  }

  return sentryServer
}
