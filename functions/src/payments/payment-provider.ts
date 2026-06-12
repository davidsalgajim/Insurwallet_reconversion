/**
 * Payment provider abstraction — Wompi (Colombia) first; Mercado Pago later.
 * Subscription writes go through Admin SDK (Firestore rules block client writes).
 */

import {
  createWompiPaymentLink,
  getWompiConfigFromEnv,
  parseWompiWebhookEvent,
  WompiError,
} from './wompi'

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
  reference: string
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

  parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>
  ): Promise<WebhookEvent>

  cancelSubscription(
    input: CancelSubscriptionInput
  ): Promise<CancelSubscriptionResult>
}

export class WompiPaymentProvider implements PaymentProvider {
  readonly name = 'wompi'

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    const total = input.lineItems.reduce(
      (sum, item) => sum + item.amountInCents * item.quantity,
      0
    )

    const result = await createWompiPaymentLink(getWompiConfigFromEnv(), {
      uid: input.uid,
      email: input.email,
      returnUrl: input.returnUrl,
      amountInCents: total,
    })

    return {
      checkoutId: result.checkoutId,
      checkoutUrl: result.checkoutUrl,
      provider: this.name,
      reference: result.reference,
      expiresAt: result.expiresAt,
    }
  }

  async parseWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>
  ): Promise<WebhookEvent> {
    const config = getWompiConfigFromEnv()
    const event = parseWompiWebhookEvent(rawBody, headers, config.eventsSecret)

    return {
      ...event,
      provider: this.name,
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
      | 'not_implemented'
      | 'not_configured',
    message: string
  ) {
    super(message)
    this.name = 'PaymentProviderError'
  }
}

export function mapWompiError(error: unknown): PaymentProviderError {
  if (error instanceof WompiError) {
    return new PaymentProviderError(error.code, error.message)
  }

  if (error instanceof Error) {
    return new PaymentProviderError('provider_unavailable', error.message)
  }

  return new PaymentProviderError('provider_unavailable', 'Unknown Wompi error')
}

export function getDefaultPaymentProvider(): PaymentProvider {
  return new WompiPaymentProvider()
}
