import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildSubscriptionReference,
  extractUidFromReference,
} from '@/lib/payments/constants'
import {
  createMercadoPagoPreapproval,
  MercadoPagoError,
  parseMercadoPagoWebhookEvent,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/payments/mercadopago'

describe('mercadopago payments', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('builds and extracts uid from subscription reference', () => {
    const uid = 'abcdefghijklmnopqrstuvwxyz12'
    const reference = buildSubscriptionReference(uid)
    expect(extractUidFromReference(reference)).toBe(uid)
  })

  it('verifies webhook x-signature', () => {
    const secret = 'test_webhook_secret'
    const dataId = 'abc123'
    const requestId = 'req-456'
    const ts = '1710000000000'
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    const v1 = createHmac('sha256', secret).update(manifest).digest('hex')
    const xSignature = `ts=${ts},v1=${v1}`

    expect(() =>
      verifyMercadoPagoWebhookSignature({
        xSignature,
        xRequestId: requestId,
        dataId,
        secret,
      })
    ).not.toThrow()
  })

  it('rejects invalid webhook signature', () => {
    expect(() =>
      verifyMercadoPagoWebhookSignature({
        xSignature: 'ts=1710000000000,v1=bad',
        xRequestId: 'req-456',
        dataId: 'abc123',
        secret: 'secret',
      })
    ).toThrow(MercadoPagoError)
  })

  it('parses subscription_preapproval webhook with mocked API fetch', async () => {
    const secret = 'test_webhook_secret'
    const uid = 'abcdefghijklmnopqrstuvwxyz12'
    const reference = buildSubscriptionReference(uid)
    const preapprovalId = 'preapproval_123'
    const requestId = 'req-789'
    const ts = '1710000000000'
    const manifest = `id:${preapprovalId};request-id:${requestId};ts:${ts};`
    const v1 = createHmac('sha256', secret).update(manifest).digest('hex')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: preapprovalId,
          status: 'authorized',
          external_reference: reference,
        }),
      })
    )

    const payload = {
      id: 987654,
      type: 'subscription_preapproval',
      data: { id: preapprovalId },
    }

    const event = await parseMercadoPagoWebhookEvent(
      JSON.stringify(payload),
      {
        'x-signature': `ts=${ts},v1=${v1}`,
        'x-request-id': requestId,
      },
      { 'data.id': preapprovalId },
      {
        accessToken: 'TEST-access-token',
        webhookSecret: secret,
      }
    )

    expect(event.subscriptionPlan).toBe('premium')
    expect(event.subscriptionStatus).toBe('active')
    expect(event.uid).toBe(uid)
    expect(event.providerSubscriptionId).toBe(preapprovalId)
  })

  it('creates preapproval checkout session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'preapproval_999',
          sandbox_init_point:
            'https://sandbox.mercadopago.com/checkout/v1/redirect',
        }),
      })
    )

    const result = await createMercadoPagoPreapproval(
      { accessToken: 'TEST-access-token', webhookSecret: 'secret' },
      {
        uid: 'abcdefghijklmnopqrstuvwxyz12',
        email: 'user@example.com',
        returnUrl:
          'https://app.example.com/settings/subscription?status=return',
      }
    )

    expect(result.checkoutId).toBe('preapproval_999')
    expect(result.checkoutUrl).toContain('mercadopago.com')
    expect(result.reference).toMatch(/^iw_/)
  })
})
