import { logger } from 'firebase-functions/v2'

import {
  buildExpiryReminderEmail,
  buildShareNotificationEmail,
  buildWelcomeEmail,
  type EmailLocale,
  type ExpiryReminderTemplateInput,
  type ShareNotificationTemplateInput,
  type WelcomeTemplateInput,
} from './email-templates'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export type SendEmailResult = {
  sent: boolean
  id?: string
  skipped?: boolean
  reason?: string
}

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined
}

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'InsurWallet <onboarding@resend.dev>'
  )
}

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const apiKey = getResendApiKey()

  if (!apiKey) {
    logger.warn('RESEND_API_KEY not configured — email skipped', {
      to: input.to,
      subject: input.subject,
    })
    return { sent: false, skipped: true, reason: 'not_configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    logger.error('Resend email failed', {
      status: response.status,
      body: body.slice(0, 200),
    })
    return { sent: false, reason: `resend_${response.status}` }
  }

  const payload = (await response.json()) as { id?: string }
  return { sent: true, id: payload.id }
}

export async function sendExpiryReminderEmail(
  to: string,
  locale: EmailLocale,
  input: ExpiryReminderTemplateInput
): Promise<SendEmailResult> {
  const template = buildExpiryReminderEmail(locale, input)
  return sendEmail({ to, ...template })
}

export async function sendShareNotificationEmail(
  to: string,
  locale: EmailLocale,
  input: ShareNotificationTemplateInput
): Promise<SendEmailResult> {
  const template = buildShareNotificationEmail(locale, input)
  return sendEmail({ to, ...template })
}

export async function sendWelcomeEmail(
  to: string,
  locale: EmailLocale,
  input: WelcomeTemplateInput
): Promise<SendEmailResult> {
  const template = buildWelcomeEmail(locale, input)
  return sendEmail({ to, ...template })
}
