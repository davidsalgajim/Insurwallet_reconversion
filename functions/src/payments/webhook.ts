import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onRequest, type Request } from 'firebase-functions/v2/https'
import type { Response } from 'express'
import { logger } from 'firebase-functions/v2'

import {
  getDefaultPaymentProvider,
  mapPaymentProviderError,
  PaymentProviderError,
  type WebhookEvent,
} from './payment-provider'

const PROCESSED_EVENTS_COLLECTION = 'paymentWebhookEvents'

function normaliseQuery(
  query: Record<string, unknown> | undefined
): Record<string, string | undefined> {
  if (!query) {
    return {}
  }

  const result: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      result[key] = value
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      result[key] = value[0]
    }
  }

  return result
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const db = getFirestore()
  const doc = await db
    .collection(PROCESSED_EVENTS_COLLECTION)
    .doc(eventId)
    .get()
  return doc.exists
}

async function markEventProcessed(event: WebhookEvent): Promise<void> {
  const db = getFirestore()
  await db.collection(PROCESSED_EVENTS_COLLECTION).doc(event.id).set({
    provider: event.provider,
    type: event.type,
    processedAt: FieldValue.serverTimestamp(),
  })
}

/**
 * Apply subscription update from a verified webhook event.
 * Only Admin SDK may write `users/{uid}.subscription` (see firestore.rules).
 */
async function applySubscriptionFromEvent(event: WebhookEvent): Promise<void> {
  if (!event.uid || !event.subscriptionPlan || !event.subscriptionStatus) {
    logger.info('webhook event ignored — no subscription fields', {
      eventId: event.id,
      type: event.type,
    })
    return
  }

  const db = getFirestore()
  await db
    .collection('users')
    .doc(event.uid)
    .set(
      {
        subscription: {
          plan: event.subscriptionPlan,
          status: event.subscriptionStatus,
          provider: event.provider,
          providerSubscriptionId: event.providerSubscriptionId,
          currentPeriodEnd: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    )
}

async function handlePaymentWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const rawBody =
    typeof req.rawBody === 'string'
      ? req.rawBody
      : (req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {}))

  const provider = getDefaultPaymentProvider()

  let event: WebhookEvent
  try {
    event = await provider.parseWebhook(
      rawBody,
      req.headers as Record<string, string>,
      normaliseQuery(req.query as Record<string, unknown>)
    )
  } catch (error) {
    const providerError =
      error instanceof PaymentProviderError
        ? error
        : mapPaymentProviderError(error)

    logger.warn('payment webhook rejected', { code: providerError.code })
    res.status(providerError.code === 'invalid_signature' ? 401 : 400).json({
      error: providerError.code,
    })
    return
  }

  if (await isEventProcessed(event.id)) {
    res.status(200).json({ status: 'already_processed', eventId: event.id })
    return
  }

  await applySubscriptionFromEvent(event)
  await markEventProcessed(event)

  res.status(200).json({ status: 'ok', eventId: event.id })
}

export const mercadoPagoPaymentWebhook = onRequest(
  { cors: false, invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    await handlePaymentWebhook(req, res)
  }
)

/** @deprecated Use mercadoPagoPaymentWebhook — kept for existing deploy URLs */
export const wompiPaymentWebhook = mercadoPagoPaymentWebhook
