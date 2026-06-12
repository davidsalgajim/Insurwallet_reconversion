import { getMessaging } from 'firebase-admin/messaging'
import { logger } from 'firebase-functions/v2'

export type PushNotificationInput = {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, string>
}

export type PushNotificationResult = {
  successCount: number
  failureCount: number
  invalidTokens: string[]
}

export async function sendPushNotification(
  input: PushNotificationInput
): Promise<PushNotificationResult> {
  const tokens = [...new Set(input.tokens.filter(Boolean))]

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] }
  }

  const messaging = getMessaging()
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: input.title,
      body: input.body,
    },
    data: input.data,
    webpush: {
      fcmOptions: {
        link: input.data?.link,
      },
    },
  })

  const invalidTokens: string[] = []
  response.responses.forEach((item, index) => {
    if (!item.success) {
      const code = item.error?.code
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[index]!)
      }
    }
  })

  logger.info('fcm multicast sent', {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens: invalidTokens.length,
  })

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  }
}
