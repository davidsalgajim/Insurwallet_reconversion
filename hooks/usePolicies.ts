'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import type { PolicyDocument } from '@/lib/firebase/policies'

async function loadPoliciesForUid(uid: string): Promise<{
  ownedPolicies: PolicyDocument[]
  sharedPolicies: PolicyDocument[]
}> {
  const [{ db }, { listPoliciesForUser, listSharedPoliciesForUser }] =
    await Promise.all([
      import('@/lib/firebase/client'),
      import('@/lib/firebase/policies'),
    ])

  const [ownedPolicies, sharedPolicies] = await Promise.all([
    listPoliciesForUser(db, uid),
    listSharedPoliciesForUser(db, uid),
  ])

  return { ownedPolicies, sharedPolicies }
}

export function usePolicies() {
  const t = useTranslations('policies.errors')
  const { user, loading: authLoading } = useAuth()
  const [ownedPolicies, setOwnedPolicies] = useState<PolicyDocument[]>([])
  const [sharedPolicies, setSharedPolicies] = useState<PolicyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setOwnedPolicies([])
      setSharedPolicies([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextPolicies = await loadPoliciesForUid(user.uid)
      setOwnedPolicies(nextPolicies.ownedPolicies)
      setSharedPolicies(nextPolicies.sharedPolicies)
    } catch {
      setError(t('loadFailed'))
      setOwnedPolicies([])
      setSharedPolicies([])
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
        setOwnedPolicies([])
        setSharedPolicies([])
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
          setOwnedPolicies(nextPolicies.ownedPolicies)
          setSharedPolicies(nextPolicies.sharedPolicies)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('loadFailed'))
          setOwnedPolicies([])
          setSharedPolicies([])
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
    policies: ownedPolicies,
    ownedPolicies,
    sharedPolicies,
    loading: authLoading || loading,
    error,
    refresh,
    isAuthenticated: Boolean(user),
  }
}
