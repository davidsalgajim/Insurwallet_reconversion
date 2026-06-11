import { Bot, Send, Sparkles } from 'lucide-react'

import { AppShell } from '@/components/layout/app-shell'
import { cn } from '@/lib/utils/cn'

type MarianaPageProps = {
  params: Promise<{ locale: string }>
}

const SUGGESTED_QUESTIONS = [
  '¿Qué cubre mi póliza de salud?',
  '¿Cuándo vence mi seguro de auto?',
  '¿Cómo reporto un siniestro?',
  '¿Qué beneficiarios tengo registrados?',
] as const

export default async function MarianaPage({ params }: MarianaPageProps) {
  const { locale } = await params

  return (
    <AppShell locale={locale}>
      <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col lg:h-[calc(100dvh-6rem)]">
        <header className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#00D1C7]/15">
            <Sparkles className="size-5 text-[#00A89E]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#0F1729]">
              MarIAna
            </h1>
            <p className="text-sm text-[#64748B]">
              Asistente de seguros — solo lectura, con citas a tus documentos.
            </p>
          </div>
        </header>

        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden rounded-[20px] border border-white/35',
            'bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_24px_rgba(15,23,41,0.08)] backdrop-blur-[20px]'
          )}
        >
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#00D1C7]/12">
              <Bot className="size-7 text-[#00A89E]" strokeWidth={1.5} />
            </div>
            <h2 className="text-balance text-lg font-semibold text-[#0F1729]">
              ¿En qué puedo ayudarte hoy?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748B]">
              Pregunta sobre coberturas, vencimientos o trámites. Las respuestas
              se basan en tus pólizas guardadas.
            </p>

            <div className="mt-8 flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="rounded-full border border-[#00D1C7]/30 bg-[#00D1C7]/8 px-4 py-2 text-left text-sm font-medium text-[#0F5C57] transition-colors duration-200 hover:border-[#00D1C7]/50 hover:bg-[#00D1C7]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1C7] focus-visible:ring-offset-2"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              'border-t border-white/35 p-4',
              'bg-white/60 backdrop-blur-[20px]'
            )}
          >
            <form className="flex items-end gap-3" action="#">
              <label htmlFor="mariana-input" className="sr-only">
                Escribe tu pregunta
              </label>
              <textarea
                id="mariana-input"
                rows={1}
                placeholder="Pregunta sobre tus pólizas…"
                className="min-h-11 flex-1 resize-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1729] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1C7] focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                aria-label="Enviar mensaje"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#00D1C7] text-[#0F1729] transition-[transform,background-color] duration-200 hover:bg-[#00BDB4] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1C7] focus-visible:ring-offset-2 disabled:opacity-50"
                disabled
              >
                <Send className="size-4" aria-hidden />
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-[#94A3B8]">
              MarIAna no reemplaza asesoría legal ni la póliza original.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
