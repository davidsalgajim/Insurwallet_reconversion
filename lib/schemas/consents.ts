import { z } from 'zod'

export const UserConsentsSchema = z.object({
  cookies: z.coerce.date().optional(),
  cloudAI: z.coerce.date().optional(),
  terms: z.coerce.date().optional(),
  privacy: z.coerce.date().optional(),
})

export type UserConsents = z.infer<typeof UserConsentsSchema>

export function hasCloudAIConsent(
  consents: UserConsents | null | undefined
): boolean {
  return (
    consents?.cloudAI instanceof Date &&
    !Number.isNaN(consents.cloudAI.getTime())
  )
}

export function hasCookieConsent(
  consents: UserConsents | null | undefined
): boolean {
  return (
    consents?.cookies instanceof Date &&
    !Number.isNaN(consents.cookies.getTime())
  )
}
