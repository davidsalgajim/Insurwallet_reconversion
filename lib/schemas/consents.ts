import { z } from 'zod'

import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/versions'

export const CLOUD_AI_CONSENT_VERSION = '2026-06-01'
export { PRIVACY_VERSION, TERMS_VERSION }

export const CloudAIConsentOutcomeSchema = z.enum(['accepted', 'declined'])
export type CloudAIConsentOutcome = z.infer<typeof CloudAIConsentOutcomeSchema>

export const ConsentSourceSchema = z.enum([
  'onboarding',
  'settings',
  'upload',
  'login',
])
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
  /** @deprecated Use termsAcceptedAt — kept for backward compatibility */
  terms: z.coerce.date().optional(),
  /** @deprecated Use privacyAcceptedAt */
  privacy: z.coerce.date().optional(),
  termsAcceptedAt: z.coerce.date().optional(),
  privacyAcceptedAt: z.coerce.date().optional(),
  termsVersion: z.string().optional(),
  privacyVersion: z.string().optional(),
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
    terms: z.boolean().optional(),
    privacy: z.boolean().optional(),
    source: ConsentSourceSchema.optional(),
  })
  .refine(
    (body) =>
      body.cookies === true ||
      body.cloudAI !== undefined ||
      body.consent !== undefined ||
      body.terms === true ||
      body.privacy === true,
    { message: 'No consent field provided' }
  )

export type ConsentPostBody = z.infer<typeof ConsentPostBodySchema>

export function getTermsAcceptedAt(
  consents: UserConsents | null | undefined
): Date | undefined {
  return consents?.termsAcceptedAt ?? consents?.terms
}

export function getPrivacyAcceptedAt(
  consents: UserConsents | null | undefined
): Date | undefined {
  return consents?.privacyAcceptedAt ?? consents?.privacy
}

export function hasTermsConsent(
  consents: UserConsents | null | undefined
): boolean {
  const acceptedAt = getTermsAcceptedAt(consents)
  return (
    acceptedAt instanceof Date &&
    !Number.isNaN(acceptedAt.getTime()) &&
    consents?.termsVersion === TERMS_VERSION
  )
}

export function hasPrivacyConsent(
  consents: UserConsents | null | undefined
): boolean {
  const acceptedAt = getPrivacyAcceptedAt(consents)
  return (
    acceptedAt instanceof Date &&
    !Number.isNaN(acceptedAt.getTime()) &&
    consents?.privacyVersion === PRIVACY_VERSION
  )
}

export function hasLegalConsent(
  consents: UserConsents | null | undefined
): boolean {
  return hasTermsConsent(consents) && hasPrivacyConsent(consents)
}

export function needsLegalReacceptance(
  consents: UserConsents | null | undefined
): boolean {
  return !hasLegalConsent(consents)
}

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
