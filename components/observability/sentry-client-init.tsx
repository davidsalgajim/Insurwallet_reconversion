'use client'

import { useEffect } from 'react'

import { initSentryClient } from '@/lib/observability/sentry.client'

export function SentryClientInit() {
  useEffect(() => {
    initSentryClient()
  }, [])

  return null
}
