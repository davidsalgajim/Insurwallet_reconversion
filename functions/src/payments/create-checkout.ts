import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

import { getDefaultPaymentProvider, mapWompiError } from './payment-provider'
import { PREMIUM_MONTHLY_AMOUNT_CENTS } from './wompi'

function parseCheckoutInput(data: unknown): {
  returnUrl: string
  cancelUrl?: string
} {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Invalid checkout payload')
  }

  const record = data as Record<string, unknown>
  const returnUrl = record.returnUrl

  if (typeof returnUrl !== 'string' || !returnUrl.startsWith('http')) {
    throw new HttpsError('invalid-argument', 'returnUrl must be a valid URL')
  }

  const cancelUrl =
    typeof record.cancelUrl === 'string' ? record.cancelUrl : undefined

  return { returnUrl, cancelUrl }
}

export const createCheckout = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const parsed = parseCheckoutInput(request.data ?? {})

  const email = request.auth.token.email
  if (!email) {
    throw new HttpsError('failed-precondition', 'User email is required')
  }

  const provider = getDefaultPaymentProvider()

  try {
    const checkout = await provider.createCheckout({
      uid: request.auth.uid,
      email,
      plan: 'premium',
      currency: 'COP',
      returnUrl: parsed.returnUrl,
      cancelUrl: parsed.cancelUrl ?? parsed.returnUrl,
      lineItems: [
        {
          name: 'InsurWallet Premium',
          amountInCents: PREMIUM_MONTHLY_AMOUNT_CENTS,
          quantity: 1,
        },
      ],
    })

    const db = getFirestore()
    await db.collection('checkoutSessions').doc(checkout.checkoutId).set({
      uid: request.auth.uid,
      provider: provider.name,
      reference: checkout.reference,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: checkout.expiresAt,
    })

    logger.info('checkout created', {
      uid: request.auth.uid,
      checkoutId: checkout.checkoutId,
    })

    return {
      checkoutId: checkout.checkoutId,
      checkoutUrl: checkout.checkoutUrl,
      provider: checkout.provider,
      expiresAt: checkout.expiresAt.toISOString(),
    }
  } catch (error) {
    const mapped = mapWompiError(error)
    logger.error('checkout failed', {
      code: mapped.code,
      uid: request.auth.uid,
    })
    throw new HttpsError('failed-precondition', mapped.message)
  }
})
