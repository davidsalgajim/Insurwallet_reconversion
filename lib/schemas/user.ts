import { z } from 'zod'

export const PreferredLanguageSchema = z.enum(['es', 'en', 'pt'])
export type PreferredLanguage = z.infer<typeof PreferredLanguageSchema>

export const SubscriptionPlanSchema = z.enum(['free', 'premium'])
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>

export const SubscriptionStatusSchema = z.enum([
  'active',
  'canceled',
  'past_due',
  'trialing',
])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>

export const SubscriptionSchema = z.object({
  plan: SubscriptionPlanSchema,
  provider: z.string().min(1).optional(),
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.coerce.date().optional(),
})
export type Subscription = z.infer<typeof SubscriptionSchema>

export const NotificationPrefsSchema = z.object({
  expiry30: z.boolean(),
  expiry60: z.boolean(),
  expiry90: z.boolean(),
  renewals: z.boolean(),
  events: z.boolean(),
})
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>

export const NotificationChannelsSchema = z
  .object({
    email: z.boolean(),
    push: z.boolean(),
  })
  .refine((channels) => channels.email || channels.push, {
    message: 'At least one notification channel must be enabled',
  })
export type NotificationChannels = z.infer<typeof NotificationChannelsSchema>

export function defaultNotificationPrefs(): NotificationPrefs {
  return {
    expiry30: true,
    expiry60: true,
    expiry90: false,
    renewals: true,
    events: false,
  }
}

export function defaultNotificationChannels(): NotificationChannels {
  return {
    email: true,
    push: false,
  }
}

export const UserProfileSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  preferredLanguage: PreferredLanguageSchema,
  subscription: SubscriptionSchema,
  notificationPrefs: NotificationPrefsSchema,
  notificationChannels: NotificationChannelsSchema,
})
export type UserProfile = z.infer<typeof UserProfileSchema>
