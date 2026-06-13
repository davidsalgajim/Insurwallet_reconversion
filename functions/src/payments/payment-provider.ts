/**
 * Payment provider abstraction — Mercado Pago (Colombia) primary; Wompi deprecated.
 * Subscription writes go through Admin SDK (Firestore rules block client writes).
 */

import {
  cancelMercadoPagoPreapproval,
  createMercadoPagoPreapproval,
  getMercadoPagoConfigFromEnv,
  MercadoPagoError,
  parseMercadoPagoWebhookEvent,
} from './mercadopago'

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
  providerSubscriptionId?: string
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
    headers: Record<string, string | undefined>,
    query?: Record<string, string | undefined>
  ): Promise<WebhookEvent>

  cancelSubscription(
    input: CancelSubscriptionInput
  ): Promise<CancelSubscriptionResult>
}

export class MercadoPagoPaymentProvider implements PaymentProvider {
  readonly name = 'mercadopago'

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    const total = input.lineItems.reduce(
      (sum, item) => sum + item.amountInCents * item.quantity,
      0
    )

    const result = await createMercadoPagoPreapproval(
      getMercadoPagoConfigFromEnv(),
      {
        uid: input.uid,
        email: input.email,
        returnUrl: input.returnUrl,
        amountInCents: total,
      }
    )

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
    headers: Record<string, string | undefined>,
    query: Record<string, string | undefined> = {}
  ): Promise<WebhookEvent> {
    const config = getMercadoPagoConfigFromEnv()
    const event = await parseMercadoPagoWebhookEvent(
      rawBody,
      headers,
      query,
      config
    )

    return {
      ...event,
      provider: this.name,
    }
  }

  async cancelSubscription(
    input: CancelSubscriptionInput
  ): Promise<CancelSubscriptionResult> {
    const result = await cancelMercadoPagoPreapproval(
      getMercadoPagoConfigFromEnv(),
      input.providerSubscriptionId
    )

    return {
      canceledAt: result.canceledAt,
      effectiveEnd: result.canceledAt,
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

export function mapPaymentProviderError(error: unknown): PaymentProviderError {
  if (error instanceof PaymentProviderError) {
    return error
  }

  if (error instanceof MercadoPagoError) {
    return new PaymentProviderError(error.code, error.message)
  }

  if (error instanceof Error) {
    return new PaymentProviderError('provider_unavailable', error.message)
  }

  return new PaymentProviderError(
    'provider_unavailable',
    'Unknown payment provider error'
  )
}

/** @deprecated Use mapPaymentProviderError */
export const mapWompiError = mapPaymentProviderError

export function getDefaultPaymentProvider(): PaymentProvider {
  return new MercadoPagoPaymentProvider()
}
