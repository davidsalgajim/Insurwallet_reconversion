'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import type { Subscription, BillingInterval } from '@/lib/schemas/user'
import { FREE_POLICY_LIMIT, PREMIUM_PLAN } from '@/lib/subscription/constants'

export type PolicyLimitResult = {
  allowed: boolean
  limit: number
  current: number
  remaining: number
  isPremium: boolean
}

export function isPremiumSubscription(
  subscription: Pick<Subscription, 'plan' | 'status'> | null | undefined
): boolean {
  if (!subscription) {
    return false
  }

  return (
    subscription.plan === PREMIUM_PLAN &&
    (subscription.status === 'active' || subscription.status === 'trialing')
  )
}

/** Pure gate: free users may own at most {@link FREE_POLICY_LIMIT} policies. */
export function checkPolicyLimit(
  policyCount: number,
  subscription: Pick<Subscription, 'plan' | 'status'> | null | undefined
): PolicyLimitResult {
  const isPremium = isPremiumSubscription(subscription)
  const remaining = isPremium
    ? Number.POSITIVE_INFINITY
    : Math.max(0, FREE_POLICY_LIMIT - policyCount)

  return {
    allowed: isPremium || policyCount < FREE_POLICY_LIMIT,
    limit: isPremium ? Number.POSITIVE_INFINITY : FREE_POLICY_LIMIT,
    current: policyCount,
    remaining,
    isPremium,
  }
}

/** Pure gate: cloud AI (MarIAna, PDF extraction) requires premium. */
export function canUseCloudAI(
  subscription: Pick<Subscription, 'plan' | 'status'> | null | undefined
): boolean {
  return isPremiumSubscription(subscription)
}

async function loadUserSubscription(uid: string): Promise<Subscription | null> {
  const [{ db }, { doc, getDoc }] = await Promise.all([
    import('@/lib/firebase/client'),
    import('firebase/firestore'),
  ])

  const snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  const subscription = data.subscription

  if (
    typeof subscription !== 'object' ||
    subscription === null ||
    typeof subscription.plan !== 'string' ||
    typeof subscription.status !== 'string'
  ) {
    return null
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    ...(typeof subscription.provider === 'string'
      ? { provider: subscription.provider }
      : {}),
    ...(parseBillingInterval(subscription.billingInterval)
      ? { billingInterval: parseBillingInterval(subscription.billingInterval) }
      : {}),
    ...(typeof subscription.providerSubscriptionId === 'string'
      ? { providerSubscriptionId: subscription.providerSubscriptionId }
      : {}),
  } as Subscription
}

function parseBillingInterval(value: unknown): BillingInterval | undefined {
  return value === 'monthly' || value === 'annual' ? value : undefined
}

export function useUserSubscription() {
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      setSubscription(await loadUserSubscription(user.uid))
    } catch {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      queueMicrotask(() => {
        setSubscription(null)
        setLoading(false)
      })
      return
    }

    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true)
      }
    })

    loadUserSubscription(user.uid)
      .then((next) => {
        if (!cancelled) {
          setSubscription(next)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubscription(null)
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
  }, [authLoading, user])

  return { subscription, loading: authLoading || loading, refresh }
}

export function usePolicyLimitGate(policyCount: number) {
  const { subscription, loading } = useUserSubscription()
  const result = checkPolicyLimit(policyCount, subscription)

  return { ...result, loading, subscription }
}

export function useCanUseCloudAI() {
  const { subscription, loading } = useUserSubscription()

  return {
    allowed: canUseCloudAI(subscription),
    loading,
    subscription,
  }
}
