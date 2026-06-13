import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { BillingIntervalSchema, SubscriptionSchema } from '@/lib/schemas/user'

export const runtime = 'nodejs'

const bodySchema = z.object({
  billingInterval: BillingIntervalSchema,
})

export async function PUT(request: Request) {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUnavailable = adminFirestoreUnavailableResponse()
  if (adminUnavailable) {
    return adminUnavailable
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid billing interval' },
      { status: 400 }
    )
  }

  const userRef = getAdminFirestore().collection('users').doc(session.uid)
  const userSnap = await userRef.get()
  const subscription = SubscriptionSchema.safeParse(
    userSnap.data()?.subscription
  )
  const current = subscription.success
    ? subscription.data
    : { plan: 'free' as const, status: 'active' as const }

  await userRef.set(
    {
      subscription: {
        ...current,
        billingInterval: parsed.data.billingInterval,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return NextResponse.json({
    billingInterval: parsed.data.billingInterval,
    annualCheckoutAvailable: false,
  })
}
