/**
 * Payment provider abstraction — Wompi (Colombia) first; Mercado Pago later.
 * Subscription writes go through Admin SDK (Firestore rules block client writes).
 */

export type CheckoutLineItem = {
  name: string
  amountInCents: number
  quantity: number
}

export type CreateCheckoutInput = {
  uid: string
  email: string
  plan: 'premium'
  currency: 'COP' | 'USD'
  returnUrl: string
  cancelUrl: string
  lineItems: CheckoutLineItem[]
}

export type CreateCheckoutResult = {
  checkoutId: string
  checkoutUrl: string
  provider: string
  expiresAt: Date
}

export type WebhookEvent = {
  id: string
  type: string
  provider: string
  uid?: string
  subscriptionPlan?: 'premium'
  subscriptionStatus?: 'active' | 'canceled' | 'past_due'
  raw: unknown
}

export type CancelSubscriptionInput = {
  uid: string
  providerSubscriptionId: string
}

export type CancelSubscriptionResult = {
  canceledAt: Date
  effectiveEnd?: Date
}

export interface PaymentProvider {
  readonly name: string

  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>

  /** Parse and validate provider webhook payload; throws if signature invalid. */
  parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>
  ): Promise<WebhookEvent>

  cancelSubscription(
    input: CancelSubscriptionInput
  ): Promise<CancelSubscriptionResult>
}

/** Stub Wompi adapter — replace with real API calls + Secret Manager keys in 5.2. */
export class WompiPaymentProvider implements PaymentProvider {
  readonly name = 'wompi'

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    const checkoutId = `wompi_stub_${input.uid}_${Date.now()}`
    const total = input.lineItems.reduce(
      (sum, item) => sum + item.amountInCents * item.quantity,
      0
    )

    return {
      checkoutId,
      checkoutUrl: `https://checkout.wompi.co/l/stub/${checkoutId}?amount=${total}`,
      provider: this.name,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    }
  }

  async parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>
  ): Promise<WebhookEvent> {
    verifyWompiSignatureSkeleton(rawBody, headers)

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      throw new PaymentProviderError(
        'invalid_payload',
        'Webhook body is not JSON'
      )
    }

    const eventId =
      typeof payload.id === 'string' ? payload.id : `wompi_evt_${Date.now()}`

    return {
      id: eventId,
      type: typeof payload.event === 'string' ? payload.event : 'unknown',
      provider: this.name,
      raw: payload,
    }
  }

  async cancelSubscription(
    _input: CancelSubscriptionInput
  ): Promise<CancelSubscriptionResult> {
    void _input
    return {
      canceledAt: new Date(),
      effectiveEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }
}

export class PaymentProviderError extends Error {
  constructor(
    readonly code:
      | 'invalid_signature'
      | 'invalid_payload'
      | 'provider_unavailable'
      | 'not_implemented',
    message: string
  ) {
    super(message)
    this.name = 'PaymentProviderError'
  }
}

/**
 * Skeleton for Wompi `X-Event-Checksum` verification (HMAC-SHA256).
 * Full implementation in 5.3 with Secret Manager `WOMPI_EVENTS_SECRET`.
 */
export function verifyWompiSignatureSkeleton(
  rawBody: string,
  headers: Record<string, string | undefined>
): void {
  const signature =
    headers['x-event-checksum'] ??
    headers['X-Event-Checksum'] ??
    headers['x-wompi-signature']

  if (!signature) {
    throw new PaymentProviderError(
      'invalid_signature',
      'Missing Wompi webhook signature header'
    )
  }

  if (signature === 'invalid' || signature.length < 8) {
    throw new PaymentProviderError(
      'invalid_signature',
      'Wompi webhook signature verification failed'
    )
  }

  void rawBody
}

export function getDefaultPaymentProvider(): PaymentProvider {
  return new WompiPaymentProvider()
}
