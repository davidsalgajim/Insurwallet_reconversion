import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

import { dmSans } from '@/lib/fonts'
import { cn } from '@/lib/utils/cn'

import './globals.css'

export const metadata: Metadata = {
  title: 'InsurWallet',
  description: 'Insurance portfolio management',
  manifest: '/manifest.webmanifest',
  applicationName: 'InsurWallet',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'InsurWallet',
  },
  icons: {
    icon: '/brand/insurwallet-logo.png',
    apple: '/brand/insurwallet-logo.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={cn('h-full antialiased', dmSans.variable)}>
      <body className={cn('min-h-full font-sans', dmSans.className)}>
        {children}
      </body>
    </html>
  )
}
