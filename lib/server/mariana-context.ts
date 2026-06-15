import { getAdminFirestore } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import type { Policy } from '@/lib/schemas/policy'
import type { PolicyMetadata } from '@/mariana/types'
import type { ToolContext } from '@/mariana/tools'

export type MarianaPolicyContext = PolicyMetadata & {
  coverages?: string
  exclusions?: string
  agent: Policy['agent']
  insurerContacts: Policy['insurerContacts']
  coverageEntries: Policy['coverageEntries']
  deductibleEntries: Policy['deductibleEntries']
  beneficiaryEntries: Policy['beneficiaryEntries']
  benefitEntries: Policy['benefitEntries']
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
    holderName: policy.holderName,
    startDate: policy.startDate,
    endDate: policy.endDate,
    premium: policy.premium,
    currency: policy.currency,
    paymentFrequency: policy.paymentFrequency,
    coverageCount: policy.coverageEntries.length,
    deductibleCount: policy.deductibleEntries.length,
    beneficiaryCount: policy.beneficiaryEntries.length,
    benefitCount: policy.benefitEntries.length,
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
      holderName: parsed.holderName,
      endDate: toIsoDate(parsed.endDate),
      startDate: toIsoDate(parsed.startDate),
      premium: parsed.premium,
      currency: parsed.currency,
      paymentFrequency: parsed.paymentFrequency,
      coverageCount: parsed.coverageEntries.length,
      deductibleCount: parsed.deductibleEntries.length,
      beneficiaryCount: parsed.beneficiaryEntries.length,
      benefitCount: parsed.benefitEntries.length,
      coverages: parsed.coverages,
      exclusions: parsed.exclusions,
      agent: parsed.agent,
      insurerContacts: parsed.insurerContacts,
      coverageEntries: parsed.coverageEntries,
      deductibleEntries: parsed.deductibleEntries,
      beneficiaryEntries: parsed.beneficiaryEntries,
      benefitEntries: parsed.benefitEntries,
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
      holderName: parsed.holderName,
      endDate: toIsoDate(parsed.endDate),
      startDate: toIsoDate(parsed.startDate),
      premium: parsed.premium,
      currency: parsed.currency,
      paymentFrequency: parsed.paymentFrequency,
      coverageCount: parsed.coverageEntries.length,
      deductibleCount: parsed.deductibleEntries.length,
      beneficiaryCount: parsed.beneficiaryEntries.length,
      benefitCount: parsed.benefitEntries.length,
      coverages: parsed.coverages,
      exclusions: parsed.exclusions,
      agent: parsed.agent,
      insurerContacts: parsed.insurerContacts,
      coverageEntries: parsed.coverageEntries,
      deductibleEntries: parsed.deductibleEntries,
      beneficiaryEntries: parsed.beneficiaryEntries,
      benefitEntries: parsed.benefitEntries,
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
