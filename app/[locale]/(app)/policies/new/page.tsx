import { ChevronRight, FileUp, PenLine } from 'lucide-react'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

const METHODS = [
  {
    id: 'upload',
    title: 'Subir PDF',
    description:
      'Extraemos los datos automáticamente. Tú revisas y confirmas antes de guardar.',
    icon: FileUp,
    href: '/policies/new/upload' as const,
    iconClass: 'stat-icon-primary',
  },
  {
    id: 'manual',
    title: 'Ingreso manual',
    description:
      'Completa los campos paso a paso si no tienes el documento a mano.',
    icon: PenLine,
    href: '/policies/new/manual' as const,
    iconClass: 'bg-white/80 text-muted-foreground',
  },
] as const

export default function NewPolicyPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <AppTopbar
        title="Nueva póliza"
        subtitle="Paso 1 de 4 — elige cómo agregar tu seguro"
      />

      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
              step === 1
                ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                : 'bg-white/60 text-muted-foreground ring-1 ring-border'
            )}
          >
            {step}
          </span>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {METHODS.map((method) => {
          const Icon = method.icon
          return (
            <Link
              key={method.id}
              href={method.href}
              className="glass-panel group flex flex-col p-6 hover:-translate-y-0.5"
            >
              <div
                className={cn(
                  'icon-circle mb-5 size-12 border-0',
                  method.iconClass
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                {method.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {method.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                Continuar
                <ChevronRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
