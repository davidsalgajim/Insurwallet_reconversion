import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AuthProvider } from '@/components/auth/auth-provider'
import { CookieConsentBanner } from '@/components/legal/consent'
import { SentryClientInit } from '@/components/observability/sentry-client-init'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { routing } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#407AFF',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common.meta' })

  return {
    title: t('title'),
    description: t('description'),
    manifest: '/manifest.webmanifest',
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <SentryClientInit />
      <ServiceWorkerRegister />
      <AuthProvider>
        {children}
        <CookieConsentBanner />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
