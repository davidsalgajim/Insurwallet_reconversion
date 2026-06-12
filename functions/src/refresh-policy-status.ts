import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions/v2'

import { computePolicyStatus, type PolicyStatus } from './policy-status'

const POLICIES_COLLECTION = 'policies'
const FIRESTORE_BATCH_LIMIT = 500

function firestoreDateToDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return new Date(value as string | number)
}

/**
 * Daily job: sync stored `status` with dates so Firestore indexes and queries stay accurate.
 * Client UI also recomputes status on read (lib/firebase/policies.parsePolicyDocument).
 */
export const refreshPolicyStatuses = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'America/Bogota',
  },
  async () => {
    const db = getFirestore()
    const now = new Date()
    const snapshot = await db.collection(POLICIES_COLLECTION).get()

    let scanned = 0
    let updated = 0
    let batch = db.batch()
    let batchOps = 0

    for (const policyDoc of snapshot.docs) {
      scanned += 1
      const data = policyDoc.data()
      const startDate = firestoreDateToDate(data.startDate)
      const endDate = firestoreDateToDate(data.endDate)
      const computed = computePolicyStatus(startDate, endDate, now)
      const stored = data.status as PolicyStatus | undefined

      if (computed === stored) {
        continue
      }

      batch.update(policyDoc.ref, { status: computed })
      updated += 1
      batchOps += 1

      if (batchOps >= FIRESTORE_BATCH_LIMIT) {
        await batch.commit()
        batch = db.batch()
        batchOps = 0
      }
    }

    if (batchOps > 0) {
      await batch.commit()
    }

    logger.info('refreshPolicyStatuses complete', { scanned, updated })
  }
)
