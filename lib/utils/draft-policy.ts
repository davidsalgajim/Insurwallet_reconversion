import type { PolicyDocument } from '@/lib/firebase/policies'

export function isDraftPolicy(policy: PolicyDocument): boolean {
  return (
    policy.policyNumber.startsWith('DRAFT-') ||
    policy.insurerName === 'Por confirmar'
  )
}
