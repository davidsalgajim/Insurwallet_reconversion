import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InsurWallet',
  description: 'Insurance portfolio management',
  icons: {
    icon: '/brand/insurwallet-logo.png',
    apple: '/brand/insurwallet-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
