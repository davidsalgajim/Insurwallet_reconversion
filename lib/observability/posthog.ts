type PostHogLike = {
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (distinctId: string, properties?: Record<string, unknown>) => void
  reset: () => void
}

const noopPostHog: PostHogLike = {
  capture: () => {},
  identify: () => {},
  reset: () => {},
}

let posthogClient: PostHogLike = noopPostHog

function resolvePostHogKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.POSTHOG_KEY ?? undefined
  )
}

/**
 * Initializes PostHog when a project key is configured.
 * Stub-safe: no posthog-js dependency until F7 wiring is complete.
 */
export function initPostHog(): PostHogLike {
  const key = resolvePostHogKey()
  if (!key) {
    return noopPostHog
  }

  if (posthogClient !== noopPostHog) {
    return posthogClient
  }

  // TODO 7.4: replace with posthog-js init({ api_key: key, ... })
  if (process.env.NODE_ENV === 'development') {
    console.info('[observability] PostHog stub active (key configured)')
  }

  posthogClient = {
    capture: (event, properties) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[posthog stub] capture', event, properties)
      }
    },
    identify: (distinctId, properties) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[posthog stub] identify', distinctId, properties)
      }
    },
    reset: () => {},
  }

  return posthogClient
}

export function getPostHog(): PostHogLike {
  if (posthogClient === noopPostHog) {
    return initPostHog()
  }

  return posthogClient
}
