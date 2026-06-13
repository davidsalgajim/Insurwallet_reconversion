import type { Policy } from '@/lib/schemas/policy'

export function canReadPolicy(
  policy: Pick<Policy, 'ownerUid' | 'sharedWith'>,
  uid: string | undefined
): boolean {
  if (!uid) {
    return false
  }

  return policy.ownerUid === uid || policy.sharedWith.includes(uid)
}

export function isPolicyOwner(
  policy: Pick<Policy, 'ownerUid'>,
  uid: string | undefined
): boolean {
  return Boolean(uid && policy.ownerUid === uid)
}
