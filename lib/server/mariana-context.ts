import { getAdminFirestore } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import type { Policy } from '@/lib/schemas/policy'
import type { PolicyMetadata } from '@/mariana/types'
import type { ToolContext } from '@/mariana/tools'

export type MarianaPolicyContext = PolicyMetadata & {
  premium: number
  currency: string
  startDate: string
  endDate: string
  coverages?: string
  exclusions?: string
  agent: Policy['agent']
  coverageEntries: Policy['coverageEntries']
  deductibleEntries: Policy['deductibleEntries']
  beneficiaryEntries: Policy['beneficiaryEntries']
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function toPolicyMetadata(policy: MarianaPolicyContext): PolicyMetadata {
  return {
    id: policy.id,
    policyNumber: policy.policyNumber,
    insurerName: policy.insurerName,
    policyType: policy.policyType,
    endDate: policy.endDate,
  }
}

export async function loadMarianaPolicyContext(uid: string): Promise<{
  ownedPolicies: MarianaPolicyContext[]
  sharedPolicies: MarianaPolicyContext[]
  toolContext: ToolContext
  allPolicies: MarianaPolicyContext[]
  metadata: PolicyMetadata[]
}> {
  const db = getAdminFirestore()

  const ownedSnap = await db
    .collection('policies')
    .where('ownerUid', '==', uid)
    .get()

  const ownedPolicies: MarianaPolicyContext[] = ownedSnap.docs.map((doc) => {
    const parsed = parsePolicyDocument(
      doc.id,
      doc.data() as Record<string, unknown>
    )
    return {
      id: parsed.id,
      policyNumber: parsed.policyNumber,
      insurerName: parsed.insurerName,
      policyType: parsed.policyType,
      endDate: toIsoDate(parsed.endDate),
      premium: parsed.premium,
      currency: parsed.currency,
      startDate: toIsoDate(parsed.startDate),
      coverages: parsed.coverages,
      exclusions: parsed.exclusions,
      agent: parsed.agent,
      coverageEntries: parsed.coverageEntries,
      deductibleEntries: parsed.deductibleEntries,
      beneficiaryEntries: parsed.beneficiaryEntries,
    }
  })

  const sharedSnap = await db
    .collection('policies')
    .where('sharedWith', 'array-contains', uid)
    .get()

  const sharedPolicies: MarianaPolicyContext[] = sharedSnap.docs.map((doc) => {
    const parsed = parsePolicyDocument(
      doc.id,
      doc.data() as Record<string, unknown>
    )
    return {
      id: parsed.id,
      policyNumber: parsed.policyNumber,
      insurerName: parsed.insurerName,
      policyType: parsed.policyType,
      endDate: toIsoDate(parsed.endDate),
      premium: parsed.premium,
      currency: parsed.currency,
      startDate: toIsoDate(parsed.startDate),
      coverages: parsed.coverages,
      exclusions: parsed.exclusions,
      agent: parsed.agent,
      coverageEntries: parsed.coverageEntries,
      deductibleEntries: parsed.deductibleEntries,
      beneficiaryEntries: parsed.beneficiaryEntries,
    }
  })

  const allPolicies = [...ownedPolicies, ...sharedPolicies]

  return {
    ownedPolicies,
    sharedPolicies,
    allPolicies,
    metadata: allPolicies.map(toPolicyMetadata),
    toolContext: {
      uid,
      ownedPolicyIds: ownedPolicies.map((policy) => policy.id),
      sharedPolicyIds: sharedPolicies.map((policy) => policy.id),
    },
  }
}
