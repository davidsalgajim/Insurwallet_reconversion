import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

import { sendPushNotification } from './fcm-service'

export async function notifyDocumentJobReady(input: {
  ownerUid: string
  policyId: string
  docId: string
  fileName?: string
}): Promise<void> {
  const db = getFirestore()
  const userSnap = await db.collection('users').doc(input.ownerUid).get()
  const user = userSnap.data()

  if (!user) {
    return
  }

  const channels = user.notificationChannels as
    | { email?: boolean; push?: boolean }
    | undefined

  if (!channels?.push) {
    return
  }

  const tokens = Array.isArray(user.fcmTokens)
    ? user.fcmTokens.filter(
        (token): token is string => typeof token === 'string'
      )
    : []

  if (tokens.length === 0) {
    return
  }

  const pushResult = await sendPushNotification({
    tokens,
    title: 'Documento listo para revisar',
    body: input.fileName
      ? `${input.fileName} ya fue procesado`
      : 'Tu póliza está lista para revisión',
    data: {
      policyId: input.policyId,
      docId: input.docId,
      link: `/policies/${input.policyId}/review`,
    },
  })

  if (pushResult.invalidTokens.length > 0) {
    await db
      .collection('users')
      .doc(input.ownerUid)
      .update({
        fcmTokens: FieldValue.arrayRemove(...pushResult.invalidTokens),
      })
      .catch(() => undefined)
  }

  logger.info('job ready push sent', {
    ownerUid: input.ownerUid,
    policyId: input.policyId,
    successCount: pushResult.successCount,
  })
}
