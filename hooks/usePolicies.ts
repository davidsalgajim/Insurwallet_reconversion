'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import type { PolicyDocument } from '@/lib/firebase/policies'

async function loadPoliciesForUid(uid: string): Promise<PolicyDocument[]> {
  const [{ db }, { listPoliciesForUser }] = await Promise.all([
    import('@/lib/firebase/client'),
    import('@/lib/firebase/policies'),
  ])
  return listPoliciesForUser(db, uid)
}

export function usePolicies() {
  const t = useTranslations('policies.errors')
  const { user, loading: authLoading } = useAuth()
  const [policies, setPolicies] = useState<PolicyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setPolicies([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextPolicies = await loadPoliciesForUid(user.uid)
      setPolicies(nextPolicies)
    } catch {
      setError(t('loadFailed'))
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }, [t, user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      queueMicrotask(() => {
        setPolicies([])
        setLoading(false)
        setError(null)
      })
      return
    }

    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true)
        setError(null)
      }
    })

    loadPoliciesForUid(user.uid)
      .then((nextPolicies) => {
        if (!cancelled) {
          setPolicies(nextPolicies)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('loadFailed'))
          setPolicies([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, t, user])

  return {
    policies,
    loading: authLoading || loading,
    error,
    refresh,
    isAuthenticated: Boolean(user),
  }
}
