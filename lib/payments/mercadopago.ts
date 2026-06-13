import { createHmac, timingSafeEqual } from 'node:crypto'

import {
  PREMIUM_CURRENCY,
  PREMIUM_MONTHLY_AMOUNT_CENTS,
  buildSubscriptionReference,
  extractUidFromReference,
} from '@/lib/payments/constants'

export type MercadoPagoConfig = {
  accessToken: string
  webhookSecret: string
  apiBaseUrl?: string
}

export type MercadoPagoPreapprovalInput = {
  uid: string
  email: string
  returnUrl: string
  amountInCents?: number
  currency?: typeof PREMIUM_CURRENCY
}

export type MercadoPagoCheckoutResult = {
  checkoutId: string
  checkoutUrl: string
  reference: string
  expiresAt: Date
}

export type MercadoPagoWebhookEvent = {
  id: string
  type: string
  uid?: string
  subscriptionPlan?: 'premium'
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  providerSubscriptionId?: string
  raw: unknown
}

export class MercadoPagoError extends Error {
  constructor(
    readonly code:
      | 'invalid_signature'
      | 'invalid_payload'
      | 'provider_unavailable'
      | 'not_configured',
    message: string
  ) {
    super(message)
    this.name = 'MercadoPagoError'
  }
}

type PreapprovalResource = {
  id?: string
  status?: string
  external_reference?: string
}

type PaymentResource = {
  id?: string
  status?: string
  external_reference?: string
}

function resolveApiBaseUrl(config: MercadoPagoConfig): string {
  if (config.apiBaseUrl?.trim()) {
    return config.apiBaseUrl.replace(/\/$/, '')
  }

  return 'https://api.mercadopago.com'
}

function normaliseHeader(
  value: string | string[] | undefined
): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

function parseSignatureHeader(header: string): {
  ts?: string
  v1?: string
} {
  let ts: string | undefined
  let v1: string | undefined

  for (const part of header.split(',')) {
    const eq = part.indexOf('=')
    if (eq === -1) {
      continue
    }

    const key = part.slice(0, eq).trim().toLowerCase()
    const value = part.slice(eq + 1).trim()

    if (key === 'ts') {
      ts = value
    } else if (key === 'v1') {
      v1 = value
    }
  }

  return { ts, v1 }
}

function buildWebhookManifest(
  dataId: string | undefined,
  requestId: string | undefined,
  ts: string
): string {
  const parts: string[] = []

  if (dataId) {
    parts.push(`id:${dataId.toLowerCase()}`)
  }

  if (requestId) {
    parts.push(`request-id:${requestId}`)
  }

  parts.push(`ts:${ts}`)
  return `${parts.join(';')};`
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export function verifyMercadoPagoWebhookSignature(options: {
  xSignature: string | undefined
  xRequestId: string | undefined
  dataId: string | undefined
  secret: string
}): void {
  if (!options.secret.trim()) {
    throw new MercadoPagoError(
      'not_configured',
      'MERCADOPAGO_WEBHOOK_SECRET is not set'
    )
  }

  const xSignature = normaliseHeader(options.xSignature)
  if (!xSignature) {
    throw new MercadoPagoError(
      'invalid_signature',
      'Missing x-signature header'
    )
  }

  const { ts, v1 } = parseSignatureHeader(xSignature)
  if (!ts || !v1) {
    throw new MercadoPagoError(
      'invalid_signature',
      'Malformed x-signature header'
    )
  }

  const manifest = buildWebhookManifest(
    normaliseHeader(options.dataId),
    normaliseHeader(options.xRequestId),
    ts
  )
  const expected = createHmac('sha256', options.secret)
    .update(manifest)
    .digest('hex')

  if (!constantTimeEquals(expected, v1)) {
    throw new MercadoPagoError(
      'invalid_signature',
      'Mercado Pago webhook signature verification failed'
    )
  }
}

function mapPreapprovalStatus(
  status: string | undefined
): MercadoPagoWebhookEvent['subscriptionStatus'] | undefined {
  switch (status) {
    case 'authorized':
      return 'active'
    case 'cancelled':
      return 'canceled'
    case 'paused':
      return 'past_due'
    default:
      return undefined
  }
}

function mapPaymentStatus(
  status: string | undefined
): MercadoPagoWebhookEvent['subscriptionStatus'] | undefined {
  if (status === 'approved') {
    return 'active'
  }

  if (
    status === 'rejected' ||
    status === 'cancelled' ||
    status === 'refunded' ||
    status === 'charged_back'
  ) {
    return 'past_due'
  }

  return undefined
}

async function fetchMercadoPagoResource<T>(
  config: MercadoPagoConfig,
  path: string
): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl(config)}${path}`, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new MercadoPagoError(
      'provider_unavailable',
      `Mercado Pago API failed (${response.status}): ${errorBody.slice(0, 200)}`
    )
  }

  return (await response.json()) as T
}

function buildEventFromReference(
  eventId: string,
  eventType: string,
  reference: string | undefined,
  subscriptionStatus: MercadoPagoWebhookEvent['subscriptionStatus'],
  providerSubscriptionId: string | undefined,
  raw: unknown
): MercadoPagoWebhookEvent {
  const uid = reference ? extractUidFromReference(reference) : undefined

  if (!uid || !subscriptionStatus) {
    return {
      id: eventId,
      type: eventType,
      uid,
      providerSubscriptionId,
      raw,
    }
  }

  return {
    id: eventId,
    type: eventType,
    uid,
    subscriptionPlan: 'premium',
    subscriptionStatus,
    providerSubscriptionId,
    raw,
  }
}

export async function parseMercadoPagoWebhookEvent(
  rawBody: string,
  headers: Record<string, string | undefined>,
  query: Record<string, string | undefined>,
  config: MercadoPagoConfig
): Promise<MercadoPagoWebhookEvent> {
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    throw new MercadoPagoError('invalid_payload', 'Webhook body is not JSON')
  }

  const data =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : {}
  const dataId =
    query['data.id'] ??
    query['data_id'] ??
    (typeof data.id === 'string' || typeof data.id === 'number'
      ? String(data.id)
      : undefined)

  verifyMercadoPagoWebhookSignature({
    xSignature: headers['x-signature'] ?? headers['X-Signature'],
    xRequestId: headers['x-request-id'] ?? headers['X-Request-Id'],
    dataId,
    secret: config.webhookSecret,
  })

  const eventType =
    (typeof payload.type === 'string' ? payload.type : undefined) ??
    query.type ??
    'unknown'
  const eventId =
    typeof payload.id === 'string' || typeof payload.id === 'number'
      ? String(payload.id)
      : `mp_evt_${eventType}_${dataId ?? Date.now()}`

  if (!dataId) {
    return {
      id: eventId,
      type: eventType,
      raw: payload,
    }
  }

  if (eventType === 'subscription_preapproval' || eventType === 'preapproval') {
    const preapproval = await fetchMercadoPagoResource<PreapprovalResource>(
      config,
      `/preapproval/${dataId}`
    )

    return buildEventFromReference(
      eventId,
      eventType,
      preapproval.external_reference,
      mapPreapprovalStatus(preapproval.status),
      preapproval.id,
      payload
    )
  }

  if (
    eventType === 'payment' ||
    eventType === 'subscription_authorized_payment'
  ) {
    const payment = await fetchMercadoPagoResource<PaymentResource>(
      config,
      `/v1/payments/${dataId}`
    )

    return buildEventFromReference(
      eventId,
      eventType,
      payment.external_reference,
      mapPaymentStatus(payment.status),
      payment.id,
      payload
    )
  }

  return {
    id: eventId,
    type: eventType,
    raw: payload,
  }
}

export async function createMercadoPagoPreapproval(
  config: MercadoPagoConfig,
  input: MercadoPagoPreapprovalInput
): Promise<MercadoPagoCheckoutResult> {
  if (!config.accessToken.trim()) {
    throw new MercadoPagoError(
      'not_configured',
      'MERCADOPAGO_ACCESS_TOKEN is not set'
    )
  }

  const reference = buildSubscriptionReference(input.uid)
  const amountInCents = input.amountInCents ?? PREMIUM_MONTHLY_AMOUNT_CENTS
  const currency = input.currency ?? PREMIUM_CURRENCY
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  const response = await fetch(`${resolveApiBaseUrl(config)}/preapproval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'InsurWallet Premium',
      external_reference: reference,
      payer_email: input.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amountInCents / 100,
        currency_id: currency,
      },
      back_url: input.returnUrl,
      status: 'pending',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new MercadoPagoError(
      'provider_unavailable',
      `Mercado Pago preapproval failed (${response.status}): ${errorBody.slice(0, 200)}`
    )
  }

  const body = (await response.json()) as {
    id?: string
    init_point?: string
    sandbox_init_point?: string
  }

  const checkoutId = body.id
  const checkoutUrl = body.sandbox_init_point ?? body.init_point

  if (!checkoutId || !checkoutUrl) {
    throw new MercadoPagoError(
      'provider_unavailable',
      'Mercado Pago response missing preapproval checkout URL'
    )
  }

  return {
    checkoutId,
    checkoutUrl,
    reference,
    expiresAt,
  }
}

export async function cancelMercadoPagoPreapproval(
  config: MercadoPagoConfig,
  preapprovalId: string
): Promise<{ canceledAt: Date }> {
  if (!config.accessToken.trim()) {
    throw new MercadoPagoError(
      'not_configured',
      'MERCADOPAGO_ACCESS_TOKEN is not set'
    )
  }

  const response = await fetch(
    `${resolveApiBaseUrl(config)}/preapproval/${preapprovalId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new MercadoPagoError(
      'provider_unavailable',
      `Mercado Pago cancel failed (${response.status}): ${errorBody.slice(0, 200)}`
    )
  }

  return { canceledAt: new Date() }
}

export function getMercadoPagoConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): MercadoPagoConfig {
  return {
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? env.MP_ACCESS_TOKEN ?? '',
    webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET ?? '',
    apiBaseUrl: env.MERCADOPAGO_API_BASE_URL,
  }
}
