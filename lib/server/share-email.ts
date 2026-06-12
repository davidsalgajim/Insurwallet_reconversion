import { resolveAppUrl } from '@/lib/server/env-server'

type ShareEmailInput = {
  recipientEmail: string
  ownerEmail?: string
  insurerName: string
  policyNumber: string
  token: string
  permission: 'view' | 'view_download'
  locale: 'es' | 'en' | 'pt'
}

const SUBJECTS: Record<'es' | 'en' | 'pt', string> = {
  es: 'Te compartieron una póliza en InsurWallet',
  en: 'A policy was shared with you on InsurWallet',
  pt: 'Compartilharam uma apólice com você no InsurWallet',
}

const PERMISSION_LABEL: Record<
  'view' | 'view_download',
  Record<'es' | 'en' | 'pt', string>
> = {
  view: {
    es: 'solo lectura',
    en: 'view only',
    pt: 'somente leitura',
  },
  view_download: {
    es: 'lectura y descarga de documentos',
    en: 'view and download documents',
    pt: 'leitura e download de documentos',
  },
}

export function buildShareEmailHtml(input: ShareEmailInput): string {
  const shareUrl = `${resolveAppUrl()}/share/${input.token}`
  const permission = PERMISSION_LABEL[input.permission][input.locale]

  const intro: Record<'es' | 'en' | 'pt', string> = {
    es: `Alguien te compartió acceso (${permission}) a la póliza ${input.insurerName} (${input.policyNumber}).`,
    en: `Someone shared ${permission} access to policy ${input.insurerName} (${input.policyNumber}).`,
    pt: `Alguém compartilhou acesso (${permission}) à apólice ${input.insurerName} (${input.policyNumber}).`,
  }

  const cta: Record<'es' | 'en' | 'pt', string> = {
    es: 'Aceptar acceso',
    en: 'Accept access',
    pt: 'Aceitar acesso',
  }

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5">
<p>${intro[input.locale]}</p>
<p><a href="${shareUrl}">${cta[input.locale]}</a></p>
<p style="color:#666;font-size:12px">${shareUrl}</p>
<p style="color:#666;font-size:12px">InsurWallet — ${input.recipientEmail}</p>
</body></html>`
}

export function buildShareEmailSubject(locale: 'es' | 'en' | 'pt'): string {
  return SUBJECTS[locale]
}

export async function sendShareInviteEmail(
  input: ShareEmailInput,
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
      subject: buildShareEmailSubject(input.locale),
      html: buildShareEmailHtml(input),
    }),
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as { id?: string }
  return payload.id ? { id: payload.id } : null
}
