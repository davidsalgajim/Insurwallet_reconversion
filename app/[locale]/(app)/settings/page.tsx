import {
  Bell,
  ChevronRight,
  Download,
  Globe,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { AppTopbar } from '@/components/layout/app-topbar'
import { cn } from '@/lib/utils/cn'

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

export default function SettingsPage() {
  return (
    <div className="animate-fade-up mx-auto w-full max-w-2xl">
      <AppTopbar
        title="Perfil"
        subtitle="Administra tu cuenta, privacidad y preferencias."
      />

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            aria-labelledby={`settings-${section.title}`}
          >
            <h2
              id={`settings-${section.title}`}
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {section.title}
            </h2>
            <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="group flex w-full min-h-[3.25rem] items-center gap-4 px-5 py-3.5 text-left transition-[background-color] duration-200 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span
                        className={cn(
                          'icon-circle size-10 shrink-0 border-0',
                          'destructive' in item && item.destructive
                            ? 'bg-[var(--primitive-coral)]/12 text-[var(--primitive-coral)]'
                            : 'bg-white/70 text-muted-foreground'
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span
                          className={cn(
                            'block text-sm font-medium',
                            'destructive' in item && item.destructive
                              ? 'text-[var(--primitive-coral)]'
                              : 'text-foreground'
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
