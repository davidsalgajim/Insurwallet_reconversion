import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { z } from 'zod'

import {
  PolicyAuditActionSchema,
  PolicyAuditLogSchema,
  type PolicyAuditAction,
} from '@/lib/schemas/policy-audit'
import {
  BenefitEntrySchema,
  BeneficiaryEntrySchema,
  CoverageEntrySchema,
  DeductibleEntrySchema,
  PaymentFrequencySchema,
  PolicyAgentSchema,
  PolicySchema,
  PolicyTypeSchema,
  type Policy,
  type PolicyAgent,
} from '@/lib/schemas/policy'
import { resolveEndDateForStorage } from '@/lib/utils/policy-dates'
import { computePolicyStatus } from '@/lib/utils/policy-status'

export type PolicyDocument = Policy & { id: string }

export const CreatePolicyInputSchema = z.object({
  ownerUid: z.string().min(1),
  insurerName: z.string().min(1),
  policyNumber: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  hasNoExpiration: z.boolean().optional(),
  policyType: PolicyTypeSchema.optional(),
  holderName: z.string().min(1).optional(),
  premium: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  paymentFrequency: PaymentFrequencySchema.optional(),
  coverages: z.string().optional(),
  beneficiaries: z.string().optional(),
  exclusions: z.string().optional(),
  waitingPeriods: z.string().optional(),
  notes: z.string().optional(),
  agent: PolicyAgentSchema.partial().optional(),
  coverageEntries: z.array(CoverageEntrySchema).optional(),
  deductibleEntries: z.array(DeductibleEntrySchema).optional(),
  beneficiaryEntries: z.array(BeneficiaryEntrySchema).optional(),
  benefitEntries: z.array(BenefitEntrySchema).optional(),
})

export type CreatePolicyInput = z.infer<typeof CreatePolicyInputSchema>

export const UpdatePolicyInputSchema = CreatePolicyInputSchema.partial().omit({
  ownerUid: true,
})

export type UpdatePolicyInput = z.infer<typeof UpdatePolicyInputSchema>

const DEFAULT_AGENT = {
  name: 'Por definir',
  phone: '+570000000000',
  email: 'pendiente@example.com',
} as const

const POLICIES_COLLECTION = 'policies'
const AUDIT_LOGS_SUBCOLLECTION = 'auditLogs'

export type WritePolicyAuditLogInput = {
  action: PolicyAuditAction
  actorUid: string
  policyNumber?: string
  insurerName?: string
  createdAt?: Date
}

export function auditLogToFirestoreData(
  log: WritePolicyAuditLogInput & { createdAt: Date }
): Record<string, unknown> {
  return {
    action: log.action,
    actorUid: log.actorUid,
    createdAt: Timestamp.fromDate(log.createdAt),
    ...(log.policyNumber ? { policyNumber: log.policyNumber } : {}),
    ...(log.insurerName ? { insurerName: log.insurerName } : {}),
  }
}

export async function writePolicyAuditLog(
  db: Firestore,
  policyId: string,
  input: WritePolicyAuditLogInput
): Promise<void> {
  const createdAt = input.createdAt ?? new Date()
  const payload = {
    action: PolicyAuditActionSchema.parse(input.action),
    actorUid: input.actorUid,
    createdAt,
    policyNumber: input.policyNumber,
    insurerName: input.insurerName,
  }

  PolicyAuditLogSchema.parse({
    ...payload,
    policyNumber: payload.policyNumber,
    insurerName: payload.insurerName,
  })

  await addDoc(
    collection(db, POLICIES_COLLECTION, policyId, AUDIT_LOGS_SUBCOLLECTION),
    auditLogToFirestoreData(payload)
  )
}

function assertPolicyOwner(policy: Policy, actorUid: string): void {
  if (policy.ownerUid !== actorUid) {
    throw new Error('No tienes permiso para modificar esta póliza')
  }
}

function resolveAgent(agent?: Partial<PolicyAgent>): PolicyAgent {
  return PolicyAgentSchema.parse({
    name: agent?.name?.trim() || DEFAULT_AGENT.name,
    phone: agent?.phone?.trim() || DEFAULT_AGENT.phone,
    email: agent?.email?.trim() || DEFAULT_AGENT.email,
  })
}

export function buildPolicyFromInput(
  input: CreatePolicyInput,
  now: Date = new Date()
): Policy {
  const parsed = CreatePolicyInputSchema.parse(input)
  const hasNoExpiration = parsed.hasNoExpiration ?? false
  const endDate = resolveEndDateForStorage(parsed.endDate, hasNoExpiration)

  return {
    ownerUid: parsed.ownerUid,
    policyNumber: parsed.policyNumber,
    insurerName: parsed.insurerName,
    policyType: parsed.policyType ?? 'other',
    holderName: parsed.holderName ?? parsed.insurerName,
    startDate: parsed.startDate,
    endDate,
    hasNoExpiration,
    premium: parsed.premium ?? 0,
    currency: parsed.currency ?? 'COP',
    paymentFrequency: parsed.paymentFrequency ?? 'annual',
    coverages: parsed.coverages,
    beneficiaries: parsed.beneficiaries,
    exclusions: parsed.exclusions,
    waitingPeriods: parsed.waitingPeriods,
    notes: parsed.notes,
    agent: resolveAgent(parsed.agent),
    coverageEntries: parsed.coverageEntries ?? [],
    deductibleEntries: parsed.deductibleEntries ?? [],
    beneficiaryEntries: parsed.beneficiaryEntries ?? [],
    benefitEntries: parsed.benefitEntries ?? [],
    sharedWith: [],
    status: computePolicyStatus(
      parsed.startDate,
      endDate,
      now,
      hasNoExpiration
    ),
    createdAt: now,
    updatedAt: now,
  }
}

export function firestoreDateToDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return (value as Timestamp).toDate()
  }

  return new Date(value as string | number)
}

export function policyToFirestoreData(policy: Policy): Record<string, unknown> {
  return {
    ...policy,
    startDate: Timestamp.fromDate(policy.startDate),
    endDate: Timestamp.fromDate(policy.endDate),
    createdAt: Timestamp.fromDate(policy.createdAt),
    updatedAt: Timestamp.fromDate(policy.updatedAt),
  }
}

export function parsePolicyDocument(
  id: string,
  data: Record<string, unknown>,
  now: Date = new Date()
): PolicyDocument {
  const normalized = {
    ...data,
    startDate: firestoreDateToDate(data.startDate),
    endDate: firestoreDateToDate(data.endDate),
    createdAt: firestoreDateToDate(data.createdAt),
    updatedAt: firestoreDateToDate(data.updatedAt),
  }

  const parsed = PolicySchema.parse(normalized)

  return {
    id,
    ...parsed,
    status: computePolicyStatus(
      parsed.startDate,
      parsed.endDate,
      now,
      parsed.hasNoExpiration
    ),
  }
}

export function mergePolicyUpdate(
  existing: Policy,
  input: UpdatePolicyInput,
  now: Date = new Date()
): Policy {
  const parsed = UpdatePolicyInputSchema.parse(input)
  const startDate = parsed.startDate ?? existing.startDate
  const hasNoExpiration = parsed.hasNoExpiration ?? existing.hasNoExpiration
  const endDate = resolveEndDateForStorage(
    parsed.endDate ?? existing.endDate,
    hasNoExpiration
  )

  return {
    ...existing,
    ...parsed,
    startDate,
    endDate,
    hasNoExpiration,
    agent: parsed.agent ? resolveAgent(parsed.agent) : existing.agent,
    status: computePolicyStatus(startDate, endDate, now, hasNoExpiration),
    updatedAt: now,
  }
}

export async function createPolicy(
  db: Firestore,
  input: CreatePolicyInput
): Promise<PolicyDocument> {
  const policy = buildPolicyFromInput(input)
  const docRef = await addDoc(
    collection(db, POLICIES_COLLECTION),
    policyToFirestoreData(policy)
  )

  return { ...policy, id: docRef.id }
}

export async function listPoliciesForUser(
  db: Firestore,
  ownerUid: string
): Promise<PolicyDocument[]> {
  const policiesQuery = query(
    collection(db, POLICIES_COLLECTION),
    where('ownerUid', '==', ownerUid)
  )
  const snapshot = await getDocs(policiesQuery)

  return snapshot.docs.map((policyDoc) =>
    parsePolicyDocument(
      policyDoc.id,
      policyDoc.data() as Record<string, unknown>
    )
  )
}

export async function listSharedPoliciesForUser(
  db: Firestore,
  uid: string
): Promise<PolicyDocument[]> {
  const policiesQuery = query(
    collection(db, POLICIES_COLLECTION),
    where('sharedWith', 'array-contains', uid)
  )
  const snapshot = await getDocs(policiesQuery)

  return snapshot.docs.map((policyDoc) =>
    parsePolicyDocument(
      policyDoc.id,
      policyDoc.data() as Record<string, unknown>
    )
  )
}

export async function getPolicy(
  db: Firestore,
  policyId: string
): Promise<PolicyDocument | null> {
  const snapshot = await getDoc(doc(db, POLICIES_COLLECTION, policyId))

  if (!snapshot.exists()) {
    return null
  }

  return parsePolicyDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>
  )
}

export async function updatePolicy(
  db: Firestore,
  policyId: string,
  input: UpdatePolicyInput,
  actorUid: string
): Promise<PolicyDocument> {
  const existing = await getPolicy(db, policyId)

  if (!existing) {
    throw new Error('Policy not found')
  }

  const { id, ...existingPolicy } = existing
  assertPolicyOwner(existingPolicy, actorUid)

  const updated = mergePolicyUpdate(existingPolicy, input)

  await updateDoc(
    doc(db, POLICIES_COLLECTION, policyId),
    policyToFirestoreData(updated)
  )

  await writePolicyAuditLog(db, policyId, {
    action: 'update',
    actorUid,
    policyNumber: updated.policyNumber,
    insurerName: updated.insurerName,
  })

  return { id, ...updated }
}

export async function deletePolicy(
  db: Firestore,
  policyId: string,
  actorUid: string
): Promise<void> {
  const existing = await getPolicy(db, policyId)

  if (!existing) {
    throw new Error('Policy not found')
  }

  assertPolicyOwner(existing, actorUid)

  await writePolicyAuditLog(db, policyId, {
    action: 'delete',
    actorUid,
    policyNumber: existing.policyNumber,
    insurerName: existing.insurerName,
  })

  await deleteDoc(doc(db, POLICIES_COLLECTION, policyId))
}
