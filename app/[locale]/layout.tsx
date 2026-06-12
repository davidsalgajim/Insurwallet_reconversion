import type { Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AuthProvider } from '@/components/auth/auth-provider'
import { routing } from '@/i18n/routing'
import { dmSans } from '@/lib/fonts'
import { cn } from '@/lib/utils/cn'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} className={cn('h-full antialiased', dmSans.variable)}>
      <body className={cn('min-h-full font-sans', dmSans.className)}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
