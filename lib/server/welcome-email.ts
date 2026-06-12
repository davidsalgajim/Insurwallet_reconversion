import { resolveAppUrl } from '@/lib/server/env-server'

type WelcomeEmailInput = {
  recipientEmail: string
  displayName: string
  locale: 'es' | 'en' | 'pt'
}

const SUBJECTS = {
  es: 'Bienvenido a InsurWallet',
  en: 'Welcome to InsurWallet',
  pt: 'Bem-vindo ao InsurWallet',
} as const

export function buildWelcomeEmailHtml(input: WelcomeEmailInput): string {
  const dashboardUrl = `${resolveAppUrl()}/dashboard`
  const greeting = {
    es: `Hola ${input.displayName}, gracias por unirte a InsurWallet.`,
    en: `Hi ${input.displayName}, thanks for joining InsurWallet.`,
    pt: `Olá ${input.displayName}, obrigado por entrar no InsurWallet.`,
  }[input.locale]

  const cta = {
    es: 'Ir al dashboard',
    en: 'Go to dashboard',
    pt: 'Ir ao painel',
  }[input.locale]

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5">
<p>${greeting}</p>
<p><a href="${dashboardUrl}">${cta}</a></p>
</body></html>`
}

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
  apiKey: string,
  fromEmail: string
): Promise<{ id: string } | null> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.recipientEmail],
      subject: SUBJECTS[input.locale],
      html: buildWelcomeEmailHtml(input),
    }),
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as { id?: string }
  return payload.id ? { id: payload.id } : null
}
