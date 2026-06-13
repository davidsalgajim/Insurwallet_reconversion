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

/** @internal test helper */
export { buildConsentUpdate, buildAuditEntry }
