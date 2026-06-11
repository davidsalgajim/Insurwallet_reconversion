import { MessageSquareText, Send } from 'lucide-react'
import { AppTopbar } from '@/components/layout/app-topbar'
import { cn } from '@/lib/utils/cn'

const SUGGESTED_QUESTIONS = [
  '¿Qué cubre mi póliza de salud?',
  '¿Cuándo vence mi seguro de auto?',
  '¿Cómo reporto un siniestro?',
  '¿Qué beneficiarios tengo registrados?',
] as const

export default function MarianaPage() {
  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-4xl flex-col">
      <AppTopbar
        title="MarIAna"
        subtitle="Asistente de seguros — solo lectura, con citas a tus documentos."
      />

      <div className="glass-panel flex min-h-[min(480px,calc(100dvh-12rem))] flex-col overflow-hidden sm:min-h-[min(560px,calc(100dvh-14rem))]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="icon-circle mb-5 size-16 stat-icon-accent border-0">
            <MessageSquareText className="size-7" strokeWidth={1.5} />
          </div>
          <span className="pill-badge mb-3 bg-accent/10 text-[#0a6b66]">
            Asistente con citas documentales
          </span>
          <h2 className="text-balance text-xl font-semibold tracking-tight">
            ¿En qué puedo ayudarte hoy?
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Pregunta sobre coberturas, vencimientos o trámites. Las respuestas
            se basan en tus pólizas guardadas.
          </p>

          <div className="mt-8 flex max-w-xl flex-wrap justify-center gap-2">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className="glass-panel rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-medium text-foreground transition-[box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 bg-white/40 p-4 backdrop-blur-sm">
          <form className="flex items-end gap-3" action="#">
            <label htmlFor="mariana-input" className="sr-only">
              Escribe tu pregunta
            </label>
            <textarea
              id="mariana-input"
              rows={1}
              placeholder="Pregunta sobre tus pólizas…"
              className="min-h-11 flex-1 resize-none rounded-[var(--radius-pill)] border border-border bg-white/80 px-4 py-3 text-sm shadow-[var(--shadow-soft)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled
              className={cn(
                'icon-circle icon-circle-active size-11 shrink-0',
                'disabled:opacity-50'
              )}
            >
              <Send className="size-4" strokeWidth={1.5} />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            MarIAna no reemplaza asesoría legal ni la póliza original.
          </p>
        </div>
      </div>
    </div>
  )
}
