import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { getFeatureFlags } from '@/lib/feature-flags'
import {
  cancelMercadoPagoPreapproval,
  getMercadoPagoConfigFromEnv,
  MercadoPagoError,
} from '@/lib/payments/mercadopago'
import { SubscriptionSchema } from '@/lib/schemas/user'

export const runtime = 'nodejs'

export async function POST() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUnavailable = adminFirestoreUnavailableResponse()
  if (adminUnavailable) {
    return adminUnavailable
  }

  const flags = getFeatureFlags()
  if (!flags.paymentsEnabled) {
    return NextResponse.json({ error: 'Payments disabled' }, { status: 403 })
  }

  const userSnap = await getAdminFirestore()
    .collection('users')
    .doc(session.uid)
    .get()
  const subscription = SubscriptionSchema.safeParse(
    userSnap.data()?.subscription
  )

  if (!subscription.success || subscription.data.plan !== 'premium') {
    return NextResponse.json(
      { error: 'No active subscription' },
      { status: 400 }
    )
  }

  const providerSubscriptionId = subscription.data.providerSubscriptionId
  if (!providerSubscriptionId) {
    return NextResponse.json(
      { error: 'Missing provider subscription id' },
      { status: 400 }
    )
  }

  try {
    await cancelMercadoPagoPreapproval(
      getMercadoPagoConfigFromEnv(),
      providerSubscriptionId
    )

    await getAdminFirestore()
      .collection('users')
      .doc(session.uid)
      .set(
        {
          subscription: {
            ...subscription.data,
            status: 'canceled',
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    return NextResponse.json({ status: 'canceled' })
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === 'not_configured' ? 503 : 502 }
      )
    }

    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 })
  }
}
