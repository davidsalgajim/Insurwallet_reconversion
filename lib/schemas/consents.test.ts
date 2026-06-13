import { describe, expect, it } from 'vitest'

import {
  CLOUD_AI_CONSENT_VERSION,
  ConsentAuditLogSchema,
  ConsentPostBodySchema,
  getCloudAIConsentStatus,
  hasCloudAIConsent,
  isCloudAIDeclined,
  resolveCloudAIOutcome,
  UserConsentsSchema,
} from '@/lib/schemas/consents'
import {
  buildAuditEntry,
  buildConsentUpdate,
} from '@/lib/server/consent-persist'

describe('UserConsentsSchema', () => {
  it('accepts enum cloudAI status with metadata', () => {
    const parsed = UserConsentsSchema.parse({
      cloudAI: 'accepted',
      cloudAIAt: '2026-06-13T10:00:00.000Z',
      cloudAIVersion: CLOUD_AI_CONSENT_VERSION,
    })

    expect(parsed.cloudAI).toBe('accepted')
    expect(parsed.cloudAIAt).toBeInstanceOf(Date)
    expect(parsed.cloudAIVersion).toBe(CLOUD_AI_CONSENT_VERSION)
  })

  it('migrates legacy cloudAI timestamp to accepted', () => {
    const parsed = UserConsentsSchema.parse({
      cloudAI: '2026-01-01T00:00:00.000Z',
    })

    expect(parsed.cloudAI).toBe('accepted')
  })
})

describe('consent helpers', () => {
  it('detects accepted, declined, and unset states', () => {
    expect(hasCloudAIConsent({ cloudAI: 'accepted' })).toBe(true)
    expect(isCloudAIDeclined({ cloudAI: 'declined' })).toBe(true)
    expect(getCloudAIConsentStatus({})).toBeNull()
  })
})

describe('ConsentPostBodySchema', () => {
  it('accepts boolean cloudAI shorthand', () => {
    expect(
      ConsentPostBodySchema.safeParse({ cloudAI: false, source: 'upload' })
        .success
    ).toBe(true)
  })

  it('accepts consent enum form', () => {
    expect(
      ConsentPostBodySchema.safeParse({ consent: 'declined' }).success
    ).toBe(true)
  })

  it('rejects empty body', () => {
    expect(ConsentPostBodySchema.safeParse({}).success).toBe(false)
  })
})

describe('resolveCloudAIOutcome', () => {
  it('maps boolean and enum payloads', () => {
    expect(resolveCloudAIOutcome({ cloudAI: true })).toBe('accepted')
    expect(resolveCloudAIOutcome({ cloudAI: false })).toBe('declined')
    expect(resolveCloudAIOutcome({ consent: 'accepted' })).toBe('accepted')
  })
})

describe('ConsentAuditLogSchema', () => {
  it('validates audit log shape', () => {
    const entry = ConsentAuditLogSchema.parse({
      action: 'consent.cloudAI',
      outcome: 'declined',
      at: new Date(),
      version: CLOUD_AI_CONSENT_VERSION,
      source: 'settings',
    })

    expect(entry.action).toBe('consent.cloudAI')
    expect(entry.outcome).toBe('declined')
  })
})

describe('consent-persist builders', () => {
  it('builds consent update with version and timestamp', () => {
    const now = new Date('2026-06-13T12:00:00.000Z')
    const update = buildConsentUpdate(
      {},
      'accepted',
      now,
      CLOUD_AI_CONSENT_VERSION
    )

    expect(update).toEqual({
      cloudAI: 'accepted',
      cloudAIAt: now,
      cloudAIVersion: CLOUD_AI_CONSENT_VERSION,
    })
  })

  it('builds audit entry for compliance trail', () => {
    const now = new Date('2026-06-13T12:00:00.000Z')
    const entry = buildAuditEntry(
      {
        uid: 'user-1',
        outcome: 'accepted',
        source: 'upload',
        ipHash: 'abc123',
      },
      now,
      CLOUD_AI_CONSENT_VERSION
    )

    expect(entry).toMatchObject({
      action: 'consent.cloudAI',
      outcome: 'accepted',
      at: now,
      version: CLOUD_AI_CONSENT_VERSION,
      source: 'upload',
      ipHash: 'abc123',
    })
  })
})
