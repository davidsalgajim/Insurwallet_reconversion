export type EmailLocale = 'es' | 'en' | 'pt'

export type ExpiryReminderTemplateInput = {
  displayName: string
  insurerName: string
  policyNumber: string
  remainingDays: number
  endDate: string
}

export type ShareNotificationTemplateInput = {
  ownerName: string
  insurerName: string
  policyNumber: string
  shareUrl: string
}

export type WelcomeTemplateInput = {
  displayName: string
}

const copy = {
  es: {
    expirySubject: (days: number) =>
      `Tu póliza vence en ${days} día${days === 1 ? '' : 's'}`,
    expiryTitle: 'Recordatorio de vencimiento',
    expiryBody: (input: ExpiryReminderTemplateInput) =>
      `Hola ${input.displayName}, tu póliza ${input.policyNumber} de ${input.insurerName} vence el ${input.endDate} (${input.remainingDays} días).`,
    shareSubject: 'Te compartieron una póliza en InsurWallet',
    shareTitle: 'Póliza compartida contigo',
    shareBody: (input: ShareNotificationTemplateInput) =>
      `${input.ownerName} te compartió la póliza ${input.policyNumber} de ${input.insurerName}.`,
    welcomeSubject: 'Bienvenido a InsurWallet',
    welcomeTitle: 'Tu billetera de seguros',
    welcomeBody: (input: WelcomeTemplateInput) =>
      `Hola ${input.displayName}, gracias por unirte a InsurWallet. Organiza tus pólizas, recibe recordatorios y consulta a MarIAna cuando lo necesites.`,
    ctaShare: 'Ver póliza compartida',
    ctaDashboard: 'Ir al dashboard',
  },
  en: {
    expirySubject: (days: number) =>
      `Your policy expires in ${days} day${days === 1 ? '' : 's'}`,
    expiryTitle: 'Expiry reminder',
    expiryBody: (input: ExpiryReminderTemplateInput) =>
      `Hi ${input.displayName}, policy ${input.policyNumber} from ${input.insurerName} expires on ${input.endDate} (${input.remainingDays} days).`,
    shareSubject: 'A policy was shared with you on InsurWallet',
    shareTitle: 'Shared policy',
    shareBody: (input: ShareNotificationTemplateInput) =>
      `${input.ownerName} shared policy ${input.policyNumber} from ${input.insurerName} with you.`,
    welcomeSubject: 'Welcome to InsurWallet',
    welcomeTitle: 'Your insurance wallet',
    welcomeBody: (input: WelcomeTemplateInput) =>
      `Hi ${input.displayName}, thanks for joining InsurWallet.`,
    ctaShare: 'View shared policy',
    ctaDashboard: 'Go to dashboard',
  },
  pt: {
    expirySubject: (days: number) =>
      `Sua apólice vence em ${days} dia${days === 1 ? '' : 's'}`,
    expiryTitle: 'Lembrete de vencimento',
    expiryBody: (input: ExpiryReminderTemplateInput) =>
      `Olá ${input.displayName}, a apólice ${input.policyNumber} da ${input.insurerName} vence em ${input.endDate} (${input.remainingDays} dias).`,
    shareSubject: 'Uma apólice foi compartilhada com você no InsurWallet',
    shareTitle: 'Apólice compartilhada',
    shareBody: (input: ShareNotificationTemplateInput) =>
      `${input.ownerName} compartilhou a apólice ${input.policyNumber} da ${input.insurerName} com você.`,
    welcomeSubject: 'Bem-vindo ao InsurWallet',
    welcomeTitle: 'Sua carteira de seguros',
    welcomeBody: (input: WelcomeTemplateInput) =>
      `Olá ${input.displayName}, obrigado por entrar no InsurWallet.`,
    ctaShare: 'Ver apólice compartilhada',
    ctaDashboard: 'Ir ao painel',
  },
} as const

function renderEmailHtml(
  title: string,
  body: string,
  cta?: { label: string; url: string }
) {
  const ctaBlock = cta
    ? `<p style="margin-top:24px"><a href="${cta.url}" style="background:#407AFF;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${cta.label}</a></p>`
    : ''

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0F1729;line-height:1.5"><h1 style="font-size:20px">${title}</h1><p>${body}</p>${ctaBlock}<p style="margin-top:32px;font-size:12px;color:#64748B">InsurWallet</p></body></html>`
}

export function buildExpiryReminderEmail(
  locale: EmailLocale,
  input: ExpiryReminderTemplateInput
) {
  const strings = copy[locale]
  return {
    subject: strings.expirySubject(input.remainingDays),
    html: renderEmailHtml(strings.expiryTitle, strings.expiryBody(input)),
  }
}

export function buildShareNotificationEmail(
  locale: EmailLocale,
  input: ShareNotificationTemplateInput
) {
  const strings = copy[locale]
  return {
    subject: strings.shareSubject,
    html: renderEmailHtml(strings.shareTitle, strings.shareBody(input), {
      label: strings.ctaShare,
      url: input.shareUrl,
    }),
  }
}

export function buildWelcomeEmail(
  locale: EmailLocale,
  input: WelcomeTemplateInput
) {
  const strings = copy[locale]
  return {
    subject: strings.welcomeSubject,
    html: renderEmailHtml(strings.welcomeTitle, strings.welcomeBody(input), {
      label: strings.ctaDashboard,
      url: process.env.APP_URL
        ? `${process.env.APP_URL.replace(/\/$/, '')}/dashboard`
        : 'https://insurwallet.com/dashboard',
    }),
  }
}
