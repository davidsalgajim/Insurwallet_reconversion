import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  buildSubscriptionReference,
  extractUidFromReference,
} from '@/lib/payments/constants'
import {
  parseWompiWebhookEvent,
  verifyWompiEventChecksum,
  WompiError,
} from '@/lib/payments/wompi'

describe('wompi payments', () => {
  it('builds and extracts uid from subscription reference', () => {
    const uid = 'abcdefghijklmnopqrstuvwxyz12'
    const reference = buildSubscriptionReference(uid)
    expect(extractUidFromReference(reference)).toBe(uid)
  })

  it('verifies webhook checksum', () => {
    const secret = 'test_events_secret'
    const payload = {
      event: 'transaction.updated',
      data: {
        transaction: {
          id: 'tx_123',
          status: 'APPROVED',
          reference: buildSubscriptionReference('abcdefghijklmnopqrstuvwxyz12'),
        },
      },
      signature: {
        properties: [
          'transaction.id',
          'transaction.status',
          'transaction.reference',
        ],
        timestamp: 1710000000,
      },
    }

    const concatenated = 'tx_123APPROVED' + payload.data.transaction.reference
    const checksum = createHash('sha256')
      .update(`${concatenated}${payload.signature.timestamp}${secret}`)
      .digest('hex')

    expect(() =>
      verifyWompiEventChecksum(payload, checksum, secret)
    ).not.toThrow()

    const event = parseWompiWebhookEvent(
      JSON.stringify(payload),
      { 'x-event-checksum': checksum },
      secret
    )

    expect(event.subscriptionPlan).toBe('premium')
    expect(event.subscriptionStatus).toBe('active')
    expect(event.uid).toBe('abcdefghijklmnopqrstuvwxyz12')
  })

  it('rejects invalid checksum', () => {
    const payload = {
      event: 'transaction.updated',
      data: { transaction: { id: 'tx_123', status: 'APPROVED' } },
      signature: {
        properties: ['transaction.id'],
        timestamp: 1710000000,
      },
    }

    expect(() => verifyWompiEventChecksum(payload, 'bad', 'secret')).toThrow(
      WompiError
    )
  })
})
