import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { AppLogo } from '@/components/brand/app-logo'
import { Link } from '@/i18n/navigation'

type LegalDocumentLayoutProps = {
  title: string
  lastUpdated: string
  children: ReactNode
}

export function LegalDocumentLayout({
  title,
  lastUpdated,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-dvh bg-white text-ink">
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <span className="font-semibold">InsurWallet</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="legal-prose space-y-6">
          <header className="space-y-2 border-b border-border/60 pb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Última actualización: {lastUpdated}
            </p>
          </header>
          {children}
        </article>
      </main>
    </div>
  )
}
