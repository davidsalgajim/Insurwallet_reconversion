'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import type { PolicyDocument } from '@/lib/firebase/policies'

async function loadPolicyById(
  policyId: string
): Promise<PolicyDocument | null> {
  const [{ db }, { getPolicy }] = await Promise.all([
    import('@/lib/firebase/client'),
    import('@/lib/firebase/policies'),
  ])
  return getPolicy(db, policyId)
}

export function usePolicy(policyId: string | undefined) {
  const { user, loading: authLoading } = useAuth()
  const [policy, setPolicy] = useState<PolicyDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!policyId || !user) {
      setPolicy(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextPolicy = await loadPolicyById(policyId)

      if (!nextPolicy) {
        setPolicy(null)
        setError('No encontramos esta póliza.')
        return
      }

      if (nextPolicy.ownerUid !== user.uid) {
        setPolicy(null)
        setError('No tienes permiso para ver esta póliza.')
        return
      }

      setPolicy(nextPolicy)
    } catch (err) {
      setPolicy(null)
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar la póliza'
      )
    } finally {
      setLoading(false)
    }
  }, [policyId, user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!policyId || !user) {
      queueMicrotask(() => {
        setPolicy(null)
        setLoading(false)
        setError(policyId && !user ? 'Debes iniciar sesión.' : null)
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

    loadPolicyById(policyId)
      .then((nextPolicy) => {
        if (cancelled) {
          return
        }

        if (!nextPolicy) {
          setPolicy(null)
          setError('No encontramos esta póliza.')
          return
        }

        if (nextPolicy.ownerUid !== user.uid) {
          setPolicy(null)
          setError('No tienes permiso para ver esta póliza.')
          return
        }

        setPolicy(nextPolicy)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPolicy(null)
          setError(
            err instanceof Error ? err.message : 'No se pudo cargar la póliza'
          )
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
  }, [authLoading, policyId, user])

  return {
    policy,
    loading: authLoading || loading,
    error,
    refresh,
    isAuthenticated: Boolean(user),
    isOwner: Boolean(user && policy && policy.ownerUid === user.uid),
  }
}
