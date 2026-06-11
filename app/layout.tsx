import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InsurWallet — Todas tus pólizas en un solo lugar',
  description:
    'Centraliza tus seguros, sube documentos con IA y consulta a MarIAna.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
