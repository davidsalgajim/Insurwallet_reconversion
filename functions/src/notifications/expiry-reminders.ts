import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions/v2'

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

/**
 * Daily scan for policies nearing expiry. FCM delivery is wired when tokens exist on users/{uid}.
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

    for (const policyDoc of snapshot.docs) {
      const data = policyDoc.data()
      const endDate = firestoreDateToDate(data.endDate)
      const remaining = daysUntil(endDate, now)

      if (remaining < 0 || remaining > 90) {
        continue
      }

      candidates += 1

      logger.info('expiry reminder candidate', {
        policyId: policyDoc.id,
        ownerUid: data.ownerUid,
        remainingDays: remaining,
      })
    }

    logger.info('sendExpiryReminders completed', {
      scanned: snapshot.size,
      candidates,
    })
  }
)
