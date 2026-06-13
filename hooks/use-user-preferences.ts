'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  type SupportedCurrency,
  type UserPreferences,
  defaultUserPreferences,
} from '@/lib/schemas/user'

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    defaultUserPreferences()
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const body = (await response.json()) as { preferences: UserPreferences }
        setPreferences(body.preferences)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const saveCurrency = useCallback(async (currency: SupportedCurrency) => {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { currency } }),
    })

    if (!response.ok) {
      throw new Error('save_failed')
    }

    const body = (await response.json()) as { preferences: UserPreferences }
    setPreferences(body.preferences)
    return body.preferences
  }, [])

  return {
    preferences,
    currency: preferences.currency,
    loading,
    refresh,
    saveCurrency,
  }
}
