import { describe, expect, it } from 'vitest'

import { FREE_POLICY_LIMIT } from '@/lib/subscription/constants'
import {
  canUseCloudAI,
  checkPolicyLimit,
  isPremiumSubscription,
} from '@/lib/subscription/gates'

describe('subscription gates', () => {
  describe('isPremiumSubscription', () => {
    it('returns true for active premium', () => {
      expect(isPremiumSubscription({ plan: 'premium', status: 'active' })).toBe(
        true
      )
    })

    it('returns false for free plan', () => {
      expect(isPremiumSubscription({ plan: 'free', status: 'active' })).toBe(
        false
      )
    })

    it('returns false for canceled premium', () => {
      expect(
        isPremiumSubscription({ plan: 'premium', status: 'canceled' })
      ).toBe(false)
    })
  })

  describe('checkPolicyLimit', () => {
    it('allows free users under the limit', () => {
      const result = checkPolicyLimit(2, { plan: 'free', status: 'active' })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(FREE_POLICY_LIMIT - 2)
    })

    it('blocks free users at the limit', () => {
      const result = checkPolicyLimit(FREE_POLICY_LIMIT, {
        plan: 'free',
        status: 'active',
      })
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('allows unlimited policies for premium', () => {
      const result = checkPolicyLimit(100, {
        plan: 'premium',
        status: 'active',
      })
      expect(result.allowed).toBe(true)
      expect(result.isPremium).toBe(true)
    })
  })

  describe('canUseCloudAI', () => {
    it('denies cloud AI for free users', () => {
      expect(canUseCloudAI({ plan: 'free', status: 'active' })).toBe(false)
    })

    it('allows cloud AI for premium users', () => {
      expect(canUseCloudAI({ plan: 'premium', status: 'active' })).toBe(true)
    })
  })
})
