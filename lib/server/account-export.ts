import { Timestamp } from 'firebase-admin/firestore'

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin'

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        serializeValue(nested),
      ])
    )
  }

  return value
}

function serializeRecord(value: unknown): Record<string, unknown> {
  const serialized = serializeValue(value)

  if (
    serialized &&
    typeof serialized === 'object' &&
    !Array.isArray(serialized)
  ) {
    return serialized as Record<string, unknown>
  }

  return {}
}

export async function buildUserDataExport(uid: string) {
  const db = getAdminFirestore()
  const auth = getAdminAuth()

  const [
    userRecord,
    userDoc,
    policiesSnap,
    sharesOwnedSnap,
    sharesReceivedSnap,
  ] = await Promise.all([
    auth.getUser(uid),
    db.collection('users').doc(uid).get(),
    db.collection('policies').where('ownerUid', '==', uid).get(),
    db.collection('shares').where('ownerUid', '==', uid).get(),
    db.collection('shares').where('recipientUid', '==', uid).get(),
  ])

  const policies = await Promise.all(
    policiesSnap.docs.map(async (policyDoc) => {
      const documentsSnap = await db
        .collection('policies')
        .doc(policyDoc.id)
        .collection('documents')
        .get()

      const auditSnap = await db
        .collection('policies')
        .doc(policyDoc.id)
        .collection('auditLogs')
        .get()

      return {
        id: policyDoc.id,
        ...serializeRecord(policyDoc.data()),
        documents: documentsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...serializeRecord(docSnap.data()),
        })),
        auditLogs: auditSnap.docs.map((logSnap) => ({
          id: logSnap.id,
          ...serializeRecord(logSnap.data()),
        })),
      }
    })
  )

  return {
    exportedAt: new Date().toISOString(),
    uid,
    auth: {
      email: userRecord.email ?? null,
      displayName: userRecord.displayName ?? null,
      emailVerified: userRecord.emailVerified,
      createdAt: userRecord.metadata.creationTime,
    },
    profile: userDoc.exists ? serializeRecord(userDoc.data()) : null,
    policies,
    shares: {
      created: sharesOwnedSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...serializeRecord(docSnap.data()),
      })),
      received: sharesReceivedSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...serializeRecord(docSnap.data()),
      })),
    },
  }
}
