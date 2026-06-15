import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import type { Tier0Intent } from '@/mariana/types'

type Locale = 'es' | 'en' | 'pt'

const DATE_LOCALE: Record<Locale, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR',
}

function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    dateStyle: 'medium',
  }).format(new Date(isoDate))
}

function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale
): string {
  return new Intl.NumberFormat(DATE_LOCALE[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function buildTier0Response(
  intent: Tier0Intent,
  policies: MarianaPolicyContext[],
  locale: Locale
): string {
  if (policies.length === 0) {
    const empty: Record<Locale, string> = {
      es: 'No encontré pólizas en tu cuenta. Agrega una póliza para consultar vencimientos, primas o contactos.',
      en: 'I could not find policies in your account. Add a policy to check renewals, premiums, or contacts.',
      pt: 'Não encontrei apólices na sua conta. Adicione uma apólice para consultar vencimentos, prêmios ou contatos.',
    }
    return empty[locale]
  }

  switch (intent) {
    case 'policy_expiry': {
      const lines = policies.map(
        (policy) =>
          `• ${policy.insurerName} (${policy.policyType}) — ${policy.policyNumber}: vence ${formatDate(policy.endDate, locale)}`
      )
      const headers: Record<Locale, string> = {
        es: 'Estas son las fechas de vencimiento registradas:',
        en: 'Here are your recorded expiry dates:',
        pt: 'Estas são as datas de vencimento registradas:',
      }
      return `${headers[locale]}\n\n${lines.join('\n')}`
    }
    case 'premium_info': {
      const lines = policies.map((policy) => {
        const premium =
          policy.premium > 0
            ? formatCurrency(policy.premium, policy.currency, locale)
            : locale === 'es'
              ? 'sin prima registrada'
              : locale === 'pt'
                ? 'sem prêmio registrado'
                : 'no premium on file'
        return `• ${policy.insurerName} (${policy.policyNumber}): ${premium}`
      })
      const headers: Record<Locale, string> = {
        es: 'Primas registradas en tus pólizas:',
        en: 'Premiums recorded on your policies:',
        pt: 'Prêmios registrados nas suas apólices:',
      }
      return `${headers[locale]}\n\n${lines.join('\n')}`
    }
    case 'contact_info': {
      const lines = policies.flatMap((policy) => {
        const agent = policy.agent
        const primary = `• ${policy.insurerName}: ${agent.name} — ${agent.phone}${agent.email ? ` — ${agent.email}` : ''}`
        const extra = (policy.insurerContacts ?? [])
          .filter((line) => line.phone || line.email)
          .map((line) => {
            const label = line.label ? `${line.label}: ` : ''
            const phone = line.phone ?? ''
            const email = line.email ? ` — ${line.email}` : ''
            return `  ↳ ${label}${phone}${email}`
          })
        return extra.length > 0 ? [primary, ...extra] : [primary]
      })
      const headers: Record<Locale, string> = {
        es: 'Contactos de agentes y aseguradoras registrados:',
        en: 'Recorded agent and insurer contacts:',
        pt: 'Contatos de agentes e seguradoras registrados:',
      }
      return `${headers[locale]}\n\n${lines.join('\n')}`
    }
    case 'beneficiary_info': {
      const lines = policies.flatMap((policy) => {
        if (policy.beneficiaryEntries.length === 0) {
          return [
            `• ${policy.insurerName} (${policy.policyNumber}): ${
              locale === 'es'
                ? 'sin beneficiarios registrados'
                : locale === 'pt'
                  ? 'sem beneficiários registrados'
                  : 'no beneficiaries on file'
            }`,
          ]
        }
        return policy.beneficiaryEntries.map((entry) => {
          const notes = entry.notes ? ` — ${entry.notes}` : ''
          return `• ${policy.insurerName} (${policy.policyNumber}): ${entry.name} — ${entry.pct}%${notes}`
        })
      })
      const headers: Record<Locale, string> = {
        es: 'Beneficiarios registrados en tus pólizas:',
        en: 'Beneficiaries recorded on your policies:',
        pt: 'Beneficiários registrados nas suas apólices:',
      }
      return `${headers[locale]}\n\n${lines.join('\n')}`
    }
  }
}
