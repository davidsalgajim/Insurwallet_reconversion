import { getStorage } from 'firebase-admin/storage'
import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

const SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000

function serializeValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'toDate' in value) {
    const maybeDate = value as { toDate?: () => Date }
    if (typeof maybeDate.toDate === 'function') {
      return maybeDate.toDate().toISOString()
    }
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
    const bucket = getStorage().bucket()
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
    })
    return url
  } catch {
    return null
  }
}

export const exportUserData = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const db = getFirestore()

  const [userDoc, policiesSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('policies').where('ownerUid', '==', uid).get(),
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

      return {
        id: policyDoc.id,
        ...serializeRecord(policyDoc.data()),
        documents,
      }
    })
  )

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    uid,
    profile: userDoc.exists ? serializeValue(userDoc.data()) : null,
    policies,
    signedUrlExpiresInDays: 7,
  }

  logger.info('exportUserData completed', {
    uid,
    policyCount: policiesSnap.size,
  })

  return {
    status: 'ok',
    data: exportPayload,
  }
})
