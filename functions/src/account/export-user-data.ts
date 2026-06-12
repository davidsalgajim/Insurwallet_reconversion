import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

/**
 * GDPR / Habeas Data export skeleton (5.10).
 * Full implementation: JSON bundle + signed Storage URLs for documents.
 */
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

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    uid,
    profile: userDoc.exists ? userDoc.data() : null,
    policies: policiesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
    documentsNote:
      'Document binaries exported separately via Storage signed URLs — stub',
  }

  logger.info('exportUserData stub completed', {
    uid,
    policyCount: policiesSnap.size,
  })

  return {
    status: 'stub',
    message: 'Export pipeline not yet implemented — payload preview only',
    data: exportPayload,
  }
})
