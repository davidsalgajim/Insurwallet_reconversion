import { getAdminFirestore } from '@/lib/firebase/admin'
import {
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'
import { usesDevIdTokenSession } from '@/lib/firebase/session-server'
import {
  CLOUD_AI_CONSENT_VERSION,
  ConsentAuditLogSchema,
  type CloudAIConsentOutcome,
  type ConsentSource,
  PRIVACY_VERSION,
  TERMS_VERSION,
  UserConsentsSchema,
} from '@/lib/schemas/consents'

export type PersistCloudAIConsentInput = {
  uid: string
  outcome: CloudAIConsentOutcome
  source: ConsentSource
  version?: string
  ipHash?: string
}

function buildConsentUpdate(
  existingConsents: Record<string, unknown>,
  outcome: CloudAIConsentOutcome,
  now: Date,
  version: string
): Record<string, unknown> {
  return {
    ...existingConsents,
    cloudAI: outcome,
    cloudAIAt: now,
    cloudAIVersion: version,
  }
}

function buildAuditEntry(
  input: PersistCloudAIConsentInput,
  now: Date,
  version: string
): Record<string, unknown> {
  const entry = ConsentAuditLogSchema.parse({
    action: 'consent.cloudAI',
    outcome: input.outcome,
    at: now,
    version,
    source: input.source,
    ...(input.ipHash ? { ipHash: input.ipHash } : {}),
  })

  return {
    action: entry.action,
    outcome: entry.outcome,
    at: entry.at,
    version: entry.version,
    source: entry.source,
    ...(entry.ipHash ? { ipHash: entry.ipHash } : {}),
  }
}

export async function persistCloudAIConsent(
  input: PersistCloudAIConsentInput
): Promise<void> {
  const now = new Date()
  const version = input.version ?? CLOUD_AI_CONSENT_VERSION
  const userData = (await readUserDocument(input.uid)) ?? {}
  const existing = UserConsentsSchema.safeParse(userData.consents)
  const currentConsents = existing.success ? existing.data : {}
  const consents = buildConsentUpdate(
    currentConsents as Record<string, unknown>,
    input.outcome,
    now,
    version
  )
  const auditEntry = buildAuditEntry(input, now, version)

  if (!usesDevIdTokenSession()) {
    const db = getAdminFirestore()
    const batch = db.batch()
    const userRef = db.collection('users').doc(input.uid)
    batch.set(
      userRef,
      {
        updatedAt: now,
        consents,
      },
      { merge: true }
    )
    const auditRef = userRef.collection('auditLogs').doc()
    batch.set(auditRef, auditEntry)
    await batch.commit()
    return
  }

  await mergeUserDocument(input.uid, {
    updatedAt: now,
    consents,
  })

  try {
    const db = getAdminFirestore()
    await db
      .collection('users')
      .doc(input.uid)
      .collection('auditLogs')
      .add(auditEntry)
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[consent] Audit log write skipped — Admin SDK unavailable in dev REST mode.'
      )
    }
  }
}

export async function persistCookieConsent(uid: string): Promise<void> {
  const now = new Date()
  const userData = (await readUserDocument(uid)) ?? {}
  const existing = UserConsentsSchema.safeParse(userData.consents)
  const currentConsents = existing.success ? existing.data : {}

  await mergeUserDocument(uid, {
    updatedAt: now,
    consents: {
      ...currentConsents,
      cookies: now,
    },
  })
}

export type PersistLegalConsentInput = {
  uid: string
  source: ConsentSource
  acceptTerms?: boolean
  acceptPrivacy?: boolean
  ipHash?: string
}

function buildLegalConsentUpdate(
  existingConsents: Record<string, unknown>,
  now: Date,
  input: PersistLegalConsentInput
): Record<string, unknown> {
  const next = { ...existingConsents }

  if (input.acceptTerms) {
    next.termsAcceptedAt = now
    next.terms = now
    next.termsVersion = TERMS_VERSION
  }

  if (input.acceptPrivacy) {
    next.privacyAcceptedAt = now
    next.privacy = now
    next.privacyVersion = PRIVACY_VERSION
  }

  return next
}

function buildLegalAuditEntry(
  input: PersistLegalConsentInput,
  now: Date
): Record<string, unknown> {
  return {
    action: 'consent.legal',
    at: now,
    source: input.source,
    termsVersion: input.acceptTerms ? TERMS_VERSION : undefined,
    privacyVersion: input.acceptPrivacy ? PRIVACY_VERSION : undefined,
    ...(input.ipHash ? { ipHash: input.ipHash } : {}),
  }
}

export async function persistLegalConsent(
  input: PersistLegalConsentInput
): Promise<void> {
  if (!input.acceptTerms && !input.acceptPrivacy) {
    return
  }

  const now = new Date()
  const userData = (await readUserDocument(input.uid)) ?? {}
  const existing = UserConsentsSchema.safeParse(userData.consents)
  const currentConsents = existing.success ? existing.data : {}
  const consents = buildLegalConsentUpdate(
    currentConsents as Record<string, unknown>,
    now,
    input
  )
  const auditEntry = buildLegalAuditEntry(input, now)

  if (!usesDevIdTokenSession()) {
    const db = getAdminFirestore()
    const batch = db.batch()
    const userRef = db.collection('users').doc(input.uid)
    batch.set(
      userRef,
      {
        updatedAt: now,
        consents,
      },
      { merge: true }
    )
    const auditRef = userRef.collection('auditLogs').doc()
    batch.set(auditRef, auditEntry)
    await batch.commit()
    return
  }

  await mergeUserDocument(input.uid, {
    updatedAt: now,
    consents,
  })

  try {
    const db = getAdminFirestore()
    await db
      .collection('users')
      .doc(input.uid)
      .collection('auditLogs')
      .add(auditEntry)
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[consent] Legal audit log write skipped — Admin SDK unavailable in dev REST mode.'
      )
    }
  }
}

/** @internal test helper */
export { buildConsentUpdate, buildAuditEntry, buildLegalConsentUpdate }
