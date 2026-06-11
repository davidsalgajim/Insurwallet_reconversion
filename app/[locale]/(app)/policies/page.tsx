import { Plus } from 'lucide-react'
import Link from 'next/link'

import { AppShell } from '@/components/layout/app-shell'
import { PoliciesEmptyState } from '@/components/policies/empty-state'

type PoliciesPageProps = {
  params: Promise<{ locale: string }>
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const { locale } = await params

  return (
    <AppShell locale={locale}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-[#0F1729]">
              Pólizas
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Gestiona y revisa tus seguros en un solo lugar.
            </p>
          </div>
          <Link
            href={`/${locale}/policies/new`}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#407AFF] px-4 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-200 hover:bg-[#3366E6] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407AFF] focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden />
            Nueva póliza
          </Link>
        </div>

        <section
          className="rounded-[20px] border border-[#E2E8F0] bg-white shadow-sm"
          aria-label="Lista de pólizas"
        >
          <PoliciesEmptyState locale={locale} />
        </section>
      </div>
    </AppShell>
  )
}
