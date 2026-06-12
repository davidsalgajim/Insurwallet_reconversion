import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions/v2'

import { sendExpiryReminderEmail } from './email-service'
import { sendPushNotification } from './fcm-service'
import type { EmailLocale } from './email-templates'

type NotificationPrefs = {
  expiry30: boolean
  expiry60: boolean
  expiry90: boolean
}

type NotificationChannels = {
  email: boolean
  push: boolean
}

function firestoreDateToDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return new Date(value as string | number)
}

function daysUntil(date: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.ceil((date.getTime() - now.getTime()) / msPerDay)
}

function shouldNotifyForDays(
  remaining: number,
  prefs: NotificationPrefs
): boolean {
  if (remaining === 30) return prefs.expiry30
  if (remaining === 60) return prefs.expiry60
  if (remaining === 90) return prefs.expiry90
  return false
}

function parsePrefs(
  data: Record<string, unknown> | undefined
): NotificationPrefs {
  return {
    expiry30: data?.expiry30 !== false,
    expiry60: data?.expiry60 !== false,
    expiry90: data?.expiry90 === true,
  }
}

function parseChannels(
  data: Record<string, unknown> | undefined
): NotificationChannels {
  return {
    email: data?.email !== false,
    push: data?.push === true,
  }
}

function parseLocale(value: unknown): EmailLocale {
  if (value === 'en' || value === 'pt') {
    return value
  }
  return 'es'
}

/**
 * Daily scan for policies nearing expiry; sends email and/or FCM per user prefs.
 */
export const sendExpiryReminders = onSchedule(
  {
    schedule: 'every day 08:00',
    timeZone: 'America/Bogota',
  },
  async () => {
    const db = getFirestore()
    const now = new Date()
    const snapshot = await db.collection('policies').get()

    let candidates = 0
    let emailsSent = 0
    let pushesSent = 0

    const userCache = new Map<string, Record<string, unknown>>()

    async function loadUser(uid: string) {
      const cached = userCache.get(uid)
      if (cached) {
        return cached
      }

      const userSnap = await db.collection('users').doc(uid).get()
      const data = userSnap.data() ?? {}
      userCache.set(uid, data)
      return data
    }

    for (const policyDoc of snapshot.docs) {
      const data = policyDoc.data()
      const ownerUid = String(data.ownerUid ?? '')
      if (!ownerUid) {
        continue
      }

      const endDate = firestoreDateToDate(data.endDate)
      const remaining = daysUntil(endDate, now)

      if (remaining < 0 || remaining > 90) {
        continue
      }

      const user = await loadUser(ownerUid)
      const prefs = parsePrefs(
        user.notificationPrefs as Record<string, unknown> | undefined
      )
      const channels = parseChannels(
        user.notificationChannels as Record<string, unknown> | undefined
      )

      if (!shouldNotifyForDays(remaining, prefs)) {
        continue
      }

      candidates += 1

      const displayName = String(user.displayName ?? 'Usuario')
      const email = String(user.email ?? '')
      const locale = parseLocale(user.preferredLanguage)
      const insurerName = String(data.insurerName ?? 'Aseguradora')
      const policyNumber = String(data.policyNumber ?? policyDoc.id)
      const endDateLabel = endDate.toLocaleDateString('es-CO')

      if (channels.email && email) {
        const result = await sendExpiryReminderEmail(email, locale, {
          displayName,
          insurerName,
          policyNumber,
          remainingDays: remaining,
          endDate: endDateLabel,
        })

        if (result.sent) {
          emailsSent += 1
        }
      }

      if (channels.push) {
        const tokens = Array.isArray(user.fcmTokens)
          ? user.fcmTokens.filter(
              (token): token is string => typeof token === 'string'
            )
          : []

        if (tokens.length > 0) {
          const pushResult = await sendPushNotification({
            tokens,
            title: `Vencimiento en ${remaining} días`,
            body: `${insurerName} · ${policyNumber}`,
            data: {
              policyId: policyDoc.id,
              link: `/policies/${policyDoc.id}`,
            },
          })

          pushesSent += pushResult.successCount

          if (pushResult.invalidTokens.length > 0) {
            await db
              .collection('users')
              .doc(ownerUid)
              .update({
                fcmTokens: FieldValue.arrayRemove(...pushResult.invalidTokens),
              })
              .catch(() => undefined)
          }
        }
      }

      logger.info('expiry reminder sent', {
        policyId: policyDoc.id,
        ownerUid,
        remainingDays: remaining,
        email: channels.email,
        push: channels.push,
      })
    }

    logger.info('sendExpiryReminders completed', {
      scanned: snapshot.size,
      candidates,
      emailsSent,
      pushesSent,
    })
  }
)
