import { createHash } from 'node:crypto'

import {
  PREMIUM_CURRENCY,
  PREMIUM_MONTHLY_AMOUNT_CENTS,
  buildSubscriptionReference,
  extractUidFromReference,
} from '@/lib/payments/constants'

export type WompiConfig = {
  privateKey: string
  eventsSecret: string
  integritySecret?: string
  apiBaseUrl?: string
}

export type WompiPaymentLinkInput = {
  uid: string
  email: string
  returnUrl: string
  amountInCents?: number
  currency?: typeof PREMIUM_CURRENCY
}

export type WompiPaymentLinkResult = {
  checkoutId: string
  checkoutUrl: string
  reference: string
  expiresAt: Date
}

export type WompiWebhookEvent = {
  id: string
  type: string
  uid?: string
  subscriptionPlan?: 'premium'
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  raw: unknown
}

export class WompiError extends Error {
  constructor(
    readonly code:
      | 'invalid_signature'
      | 'invalid_payload'
      | 'provider_unavailable'
      | 'not_configured',
    message: string
  ) {
    super(message)
    this.name = 'WompiError'
  }
}

function resolveApiBaseUrl(config: WompiConfig): string {
  if (config.apiBaseUrl?.trim()) {
    return config.apiBaseUrl.replace(/\/$/, '')
  }

  return config.privateKey.includes('_test_')
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1'
}

export function verifyWompiEventChecksum(
  payload: Record<string, unknown>,
  headerChecksum: string | undefined,
  eventsSecret: string
): void {
  if (!eventsSecret.trim()) {
    throw new WompiError('not_configured', 'WOMPI_EVENTS_SECRET is not set')
  }

  if (!headerChecksum?.trim()) {
    throw new WompiError('invalid_signature', 'Missing X-Event-Checksum header')
  }

  const signature = payload.signature
  if (!signature || typeof signature !== 'object') {
    throw new WompiError('invalid_payload', 'Missing signature object in event')
  }

  const signatureRecord = signature as Record<string, unknown>
  const properties = signatureRecord.properties
  const timestamp = signatureRecord.timestamp

  if (!Array.isArray(properties) || typeof timestamp !== 'number') {
    throw new WompiError('invalid_payload', 'Invalid signature metadata')
  }

  const data =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : {}
  const transaction =
    data.transaction && typeof data.transaction === 'object'
      ? (data.transaction as Record<string, unknown>)
      : data

  const concatenated = properties
    .map((property) => {
      const path = String(property).split('.')
      let current: unknown = { transaction, ...data }

      for (const segment of path) {
        if (!current || typeof current !== 'object') {
          return ''
        }
        current = (current as Record<string, unknown>)[segment]
      }

      return current == null ? '' : String(current)
    })
    .join('')

  const expected = createHash('sha256')
    .update(`${concatenated}${timestamp}${eventsSecret}`)
    .digest('hex')

  if (expected !== headerChecksum && expected !== signatureRecord.checksum) {
    throw new WompiError(
      'invalid_signature',
      'Wompi webhook signature verification failed'
    )
  }
}

export function parseWompiWebhookEvent(
  rawBody: string,
  headers: Record<string, string | undefined>,
  eventsSecret: string
): WompiWebhookEvent {
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    throw new WompiError('invalid_payload', 'Webhook body is not JSON')
  }

  verifyWompiEventChecksum(
    payload,
    headers['x-event-checksum'] ?? headers['X-Event-Checksum'],
    eventsSecret
  )

  const eventId =
    typeof payload.event === 'string'
      ? `${payload.event}_${String(payload.timestamp ?? Date.now())}`
      : typeof payload.id === 'string'
        ? payload.id
        : `wompi_evt_${Date.now()}`

  const data =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : {}
  const transaction =
    data.transaction && typeof data.transaction === 'object'
      ? (data.transaction as Record<string, unknown>)
      : data

  const reference =
    typeof transaction.reference === 'string'
      ? transaction.reference
      : undefined
  const status =
    typeof transaction.status === 'string' ? transaction.status : undefined
  const uid = reference ? extractUidFromReference(reference) : undefined

  const eventType =
    typeof payload.event === 'string' ? payload.event : 'unknown'

  if (eventType.includes('transaction') && status === 'APPROVED' && uid) {
    return {
      id: eventId,
      type: eventType,
      uid,
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      raw: payload,
    }
  }

  if (
    eventType.includes('transaction') &&
    (status === 'DECLINED' || status === 'ERROR') &&
    uid
  ) {
    return {
      id: eventId,
      type: eventType,
      uid,
      subscriptionPlan: 'premium',
      subscriptionStatus: 'past_due',
      raw: payload,
    }
  }

  return {
    id: eventId,
    type: eventType,
    uid,
    raw: payload,
  }
}

export async function createWompiPaymentLink(
  config: WompiConfig,
  input: WompiPaymentLinkInput
): Promise<WompiPaymentLinkResult> {
  if (!config.privateKey.trim()) {
    throw new WompiError('not_configured', 'WOMPI_PRIVATE_KEY is not set')
  }

  const reference = buildSubscriptionReference(input.uid)
  const amountInCents = input.amountInCents ?? PREMIUM_MONTHLY_AMOUNT_CENTS
  const currency = input.currency ?? PREMIUM_CURRENCY
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  const response = await fetch(`${resolveApiBaseUrl(config)}/payment_links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.privateKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'InsurWallet Premium',
      description: 'Suscripción mensual InsurWallet Premium',
      single_use: true,
      collect_shipping: false,
      currency,
      amount_in_cents: amountInCents,
      expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
      redirect_url: input.returnUrl,
      sku: input.uid.slice(0, 36),
      customer_data: {
        customer_references: [
          {
            label: 'Email',
            is_required: false,
            value: input.email,
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new WompiError(
      'provider_unavailable',
      `Wompi payment link failed (${response.status}): ${errorBody.slice(0, 200)}`
    )
  }

  const body = (await response.json()) as {
    data?: { id?: string }
  }

  const checkoutId = body.data?.id
  if (!checkoutId) {
    throw new WompiError(
      'provider_unavailable',
      'Wompi response missing link id'
    )
  }

  return {
    checkoutId,
    checkoutUrl: `https://checkout.wompi.co/l/${checkoutId}`,
    reference,
    expiresAt,
  }
}
