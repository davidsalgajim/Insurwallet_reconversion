export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentryServer } =
      await import('@/lib/observability/sentry.server')
    initSentryServer()
  }
}

export async function onRequestError(
  error: unknown,
  request: {
    path: string
    method: string
    headers: Record<string, string | string[] | undefined>
  },
  context: {
    routerKind: string
    routePath: string
    routeType: string
  }
) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN
  if (!dsn) {
    return
  }

  const Sentry = await import('@sentry/nextjs')
  Sentry.captureException(error, {
    extra: {
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  })
}
