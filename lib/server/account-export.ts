import { Timestamp } from 'firebase-admin/firestore'

import {
  getAdminAuth,
  getAdminFirestore,
  getAdminStorage,
} from '@/lib/firebase/admin'

const SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000

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

async function signedUrlForPath(storagePath: string): Promise<string | null> {
  if (!storagePath) {
    return null
  }

  try {
    const bucket = getAdminStorage().bucket()
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
    })
    return url
  } catch {
    return null
  }
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

      const documents = await Promise.all(
        documentsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data()
          const storagePath =
            typeof data.storagePath === 'string' ? data.storagePath : ''

          return {
            id: docSnap.id,
            ...serializeRecord(data),
            downloadUrl: await signedUrlForPath(storagePath),
          }
        })
      )

      const auditSnap = await db
        .collection('policies')
        .doc(policyDoc.id)
        .collection('auditLogs')
        .get()

      return {
        id: policyDoc.id,
        ...serializeRecord(policyDoc.data()),
        documents,
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
    signedUrlExpiresInDays: 7,
  }
}
