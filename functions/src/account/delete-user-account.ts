import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

/**
 * GDPR account deletion skeleton (5.10).
 * Full implementation: cascade delete policies, Storage objects, audit log entry.
 */
export const deleteUserAccount = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const confirm = request.data?.confirm

  if (confirm !== true) {
    throw new HttpsError(
      'failed-precondition',
      'Explicit confirmation required (confirm: true)'
    )
  }

  const db = getFirestore()
  const policiesSnap = await db
    .collection('policies')
    .where('ownerUid', '==', uid)
    .get()

  logger.info('deleteUserAccount stub — no data deleted', {
    uid,
    policyCount: policiesSnap.size,
  })

  return {
    status: 'stub',
    message:
      'Account deletion pipeline not yet implemented — no data was removed',
    uid,
    policiesFound: policiesSnap.size,
  }
})
