import { describe, expect, it } from 'vitest'

import { canReadPolicy, isPolicyOwner } from './policy-access'

describe('policy-access', () => {
  const policy = {
    ownerUid: 'owner-1',
    sharedWith: ['shared-1', 'shared-2'],
  }

  it('allows owner read access', () => {
    expect(canReadPolicy(policy, 'owner-1')).toBe(true)
    expect(isPolicyOwner(policy, 'owner-1')).toBe(true)
  })

  it('allows shared user read access', () => {
    expect(canReadPolicy(policy, 'shared-1')).toBe(true)
    expect(isPolicyOwner(policy, 'shared-1')).toBe(false)
  })

  it('denies unrelated users', () => {
    expect(canReadPolicy(policy, 'other-uid')).toBe(false)
    expect(canReadPolicy(policy, undefined)).toBe(false)
  })
})
