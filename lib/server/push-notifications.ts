import { FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

import { getAdminFirestore } from '@/lib/firebase/admin'

export async function notifyDocumentJobReady(input: {
  ownerUid: string
  policyId: string
  docId: string
  fileName?: string
}): Promise<void> {
  const db = getAdminFirestore()
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

  const messaging = getMessaging()
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: 'Documento listo para revisar',
      body: input.fileName
        ? `${input.fileName} ya fue procesado`
        : 'Tu póliza está lista para revisión',
    },
    data: {
      policyId: input.policyId,
      docId: input.docId,
      link: `/policies/${input.policyId}/review`,
    },
    webpush: {
      fcmOptions: {
        link: `/policies/${input.policyId}/review`,
      },
    },
  })

  const invalidTokens = response.responses.flatMap((item, index) => {
    if (item.success) {
      return []
    }

    const code = item.error?.code
    if (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    ) {
      return [tokens[index]!]
    }

    return []
  })

  if (invalidTokens.length > 0) {
    await db
      .collection('users')
      .doc(input.ownerUid)
      .update({
        fcmTokens: FieldValue.arrayRemove(...invalidTokens),
      })
      .catch(() => undefined)
  }
}
