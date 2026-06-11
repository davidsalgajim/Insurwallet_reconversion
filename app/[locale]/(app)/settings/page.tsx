import {
  Bell,
  ChevronRight,
  Download,
  Globe,
  Shield,
  Trash2,
  User,
} from 'lucide-react'

import { AppShell } from '@/components/layout/app-shell'
import { cn } from '@/lib/utils/cn'

type SettingsPageProps = {
  params: Promise<{ locale: string }>
}

const SECTIONS = [
  {
    title: 'Perfil',
    items: [
      { icon: User, label: 'Datos personales', hint: 'Nombre, correo y foto' },
    ],
  },
  {
    title: 'Privacidad y datos',
    items: [
      {
        icon: Shield,
        label: 'Privacidad',
        hint: 'Consentimiento y tratamiento de datos',
      },
      {
        icon: Download,
        label: 'Exportar mis datos',
        hint: 'Descarga en formato portable',
      },
      {
        icon: Trash2,
        label: 'Eliminar cuenta',
        hint: 'Borrado permanente',
        destructive: true,
      },
    ],
  },
  {
    title: 'Preferencias',
    items: [
      { icon: Bell, label: 'Notificaciones', hint: 'Vencimientos y alertas' },
      { icon: Globe, label: 'Idioma', hint: 'Español' },
    ],
  },
] as const

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params

  return (
    <AppShell locale={locale}>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-[#0F1729]">
            Perfil
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Administra tu cuenta, privacidad y preferencias.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <section
            key={section.title}
            aria-labelledby={`settings-${section.title}`}
          >
            <h2
              id={`settings-${section.title}`}
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]"
            >
              {section.title}
            </h2>
            <ul className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-sm">
              {section.items.map((item, index) => {
                const Icon = item.icon
                const isLast = index === section.items.length - 1
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full min-h-[3.25rem] items-center gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#407AFF]',
                        !isLast && 'border-b border-[#E2E8F0]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl',
                          'destructive' in item && item.destructive
                            ? 'bg-[#F55252]/10 text-[#C53030]'
                            : 'bg-[#F1F5F9] text-[#475569]'
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm font-medium',
                            'destructive' in item && item.destructive
                              ? 'text-[#C53030]'
                              : 'text-[#0F1729]'
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-[#64748B]">
                          {item.hint}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-[#94A3B8]"
                        aria-hidden
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  )
}
