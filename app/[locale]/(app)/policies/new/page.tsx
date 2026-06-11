import { ChevronRight, FileUp, PenLine } from 'lucide-react'
import Link from 'next/link'

import { AppShell } from '@/components/layout/app-shell'
import { cn } from '@/lib/utils/cn'

type NewPolicyPageProps = {
  params: Promise<{ locale: string }>
}

const METHODS = [
  {
    id: 'upload',
    title: 'Subir PDF',
    description:
      'Extraemos los datos automáticamente. Tú revisas y confirmas antes de guardar.',
    icon: FileUp,
    href: (locale: string) => `/${locale}/policies/new/upload`,
    accent:
      'border-[#407AFF]/20 hover:border-[#407AFF]/40 hover:bg-[#407AFF]/[0.04]',
    iconBg: 'bg-[#407AFF]/10 text-[#407AFF]',
  },
  {
    id: 'manual',
    title: 'Ingreso manual',
    description:
      'Completa los campos paso a paso si no tienes el documento a mano.',
    icon: PenLine,
    href: (locale: string) => `/${locale}/policies/new/manual`,
    accent: 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]',
    iconBg: 'bg-[#F1F5F9] text-[#475569]',
  },
] as const

export default async function NewPolicyPage({ params }: NewPolicyPageProps) {
  const { locale } = await params

  return (
    <AppShell locale={locale}>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Paso 1 de 4
          </p>
          <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-[#0F1729]">
            ¿Cómo quieres agregar tu póliza?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
            Elige el método que prefieras. Siempre podrás editar los datos antes
            de guardar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {METHODS.map((method) => {
            const Icon = method.icon
            return (
              <Link
                key={method.id}
                href={method.href(locale)}
                className={cn(
                  'group flex flex-col rounded-[20px] border bg-white p-6 shadow-sm transition-[border-color,background-color,transform] duration-200 active:scale-[0.99]',
                  method.accent
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex size-12 items-center justify-center rounded-xl',
                    method.iconBg
                  )}
                >
                  <Icon className="size-6" strokeWidth={1.75} />
                </div>
                <h2 className="text-lg font-semibold text-[#0F1729]">
                  {method.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#64748B]">
                  {method.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#407AFF]">
                  Continuar
                  <ChevronRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
