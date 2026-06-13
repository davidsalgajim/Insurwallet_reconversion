import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { getFeatureFlags } from '@/lib/feature-flags'
import { PREMIUM_MONTHLY_AMOUNT_CENTS } from '@/lib/payments/constants'
import { createWompiPaymentLink, WompiError } from '@/lib/payments/wompi'

export const runtime = 'nodejs'

const checkoutSchema = z.object({
  returnUrl: z.string().url(),
})

export async function POST(request: Request) {
  const session = await requireSession()

  if (!session?.uid || !session.email) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid checkout payload' },
      { status: 400 }
    )
  }

  try {
    const checkout = await createWompiPaymentLink(
      {
        privateKey: process.env.WOMPI_PRIVATE_KEY ?? '',
        eventsSecret: process.env.WOMPI_EVENTS_SECRET ?? '',
        apiBaseUrl: process.env.WOMPI_API_BASE_URL,
      },
      {
        uid: session.uid,
        email: session.email,
        returnUrl: parsed.data.returnUrl,
        amountInCents: PREMIUM_MONTHLY_AMOUNT_CENTS,
      }
    )

    await getAdminFirestore()
      .collection('checkoutSessions')
      .doc(checkout.checkoutId)
      .set({
        uid: session.uid,
        provider: 'wompi',
        reference: checkout.reference,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: checkout.expiresAt,
      })

    return NextResponse.json({
      checkoutId: checkout.checkoutId,
      checkoutUrl: checkout.checkoutUrl,
      provider: 'wompi',
      expiresAt: checkout.expiresAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof WompiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        {
          status: error.code === 'not_configured' ? 503 : 502,
        }
      )
    }

    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
