import { cn } from '@/lib/utils/cn'

type JourneyVisualProps = {
  title: string
  subtitle?: string
  className?: string
}

export function JourneyVisual({
  title,
  subtitle,
  className,
}: JourneyVisualProps) {
  return (
    <section
      className={cn(
        'glass-panel relative overflow-hidden p-6 sm:p-7',
        className
      )}
      aria-labelledby="journey-visual-title"
    >
      <div className="relative z-10">
        <h2
          id="journey-visual-title"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Liquid glass overlapping arcs — Dribbble Support Ticket Journey */}
      <div
        className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full bg-[var(--primitive-accent-soft)]/35 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 right-24 h-44 w-44 rounded-full bg-[var(--primitive-coral)]/30 blur-xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-4 right-8 flex items-end gap-3"
        aria-hidden
      >
        <div className="glass-surface flex size-20 items-center justify-center rounded-full border-white/70 text-2xl font-bold text-primary shadow-lg backdrop-blur-xl">
          0
        </div>
        <div className="glass-surface-dark mb-6 flex size-14 items-center justify-center rounded-full text-lg font-semibold text-white shadow-xl">
          —
        </div>
      </div>
    </section>
  )
}
