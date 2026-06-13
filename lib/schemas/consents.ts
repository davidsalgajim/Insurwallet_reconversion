import { z } from 'zod'

export const CLOUD_AI_CONSENT_VERSION = '2026-06-01'

export const CloudAIConsentOutcomeSchema = z.enum(['accepted', 'declined'])
export type CloudAIConsentOutcome = z.infer<typeof CloudAIConsentOutcomeSchema>

export const ConsentSourceSchema = z.enum(['onboarding', 'settings', 'upload'])
export type ConsentSource = z.infer<typeof ConsentSourceSchema>

/** Legacy records stored cloudAI as a timestamp; treat as accepted. */
const CloudAIConsentValueSchema = z.union([
  CloudAIConsentOutcomeSchema,
  z.coerce.date().transform(() => 'accepted' as const),
])

export const UserConsentsSchema = z.object({
  cookies: z.coerce.date().optional(),
  cloudAI: CloudAIConsentValueSchema.optional(),
  cloudAIAt: z.coerce.date().optional(),
  cloudAIVersion: z.string().optional(),
  terms: z.coerce.date().optional(),
  privacy: z.coerce.date().optional(),
})

export type UserConsents = z.infer<typeof UserConsentsSchema>

export type CloudAIConsentStatus = CloudAIConsentOutcome | null

export function getCloudAIConsentStatus(
  consents: UserConsents | null | undefined
): CloudAIConsentStatus {
  const value = consents?.cloudAI
  if (value === 'accepted' || value === 'declined') {
    return value
  }
  return null
}

export function hasCloudAIConsent(
  consents: UserConsents | null | undefined
): boolean {
  return getCloudAIConsentStatus(consents) === 'accepted'
}

export function isCloudAIDeclined(
  consents: UserConsents | null | undefined
): boolean {
  return getCloudAIConsentStatus(consents) === 'declined'
}

export function hasCookieConsent(
  consents: UserConsents | null | undefined
): boolean {
  return (
    consents?.cookies instanceof Date &&
    !Number.isNaN(consents.cookies.getTime())
  )
}

export const ConsentAuditLogSchema = z.object({
  action: z.literal('consent.cloudAI'),
  outcome: CloudAIConsentOutcomeSchema,
  at: z.coerce.date(),
  version: z.string().min(1),
  source: ConsentSourceSchema,
  ipHash: z.string().optional(),
})

export type ConsentAuditLog = z.infer<typeof ConsentAuditLogSchema>

export const ConsentPostBodySchema = z
  .object({
    cookies: z.boolean().optional(),
    cloudAI: z.boolean().optional(),
    consent: CloudAIConsentOutcomeSchema.optional(),
    source: ConsentSourceSchema.optional(),
  })
  .refine(
    (body) =>
      body.cookies === true ||
      body.cloudAI !== undefined ||
      body.consent !== undefined,
    { message: 'No consent field provided' }
  )

export type ConsentPostBody = z.infer<typeof ConsentPostBodySchema>

export function resolveCloudAIOutcome(
  body: Pick<ConsentPostBody, 'cloudAI' | 'consent'>
): CloudAIConsentOutcome | undefined {
  if (body.consent !== undefined) {
    return body.consent
  }

  if (body.cloudAI === true) {
    return 'accepted'
  }

  if (body.cloudAI === false) {
    return 'declined'
  }

  return undefined
}
