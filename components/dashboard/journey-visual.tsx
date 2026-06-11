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
        'glass-panel relative min-h-[10rem] overflow-hidden p-4 sm:min-h-[12rem] sm:p-6 md:p-7',
        className
      )}
      aria-labelledby="journey-visual-title"
    >
      <div className="relative z-10 max-w-[70%] sm:max-w-md">
        <h2
          id="journey-visual-title"
          className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        className="pointer-events-none absolute -bottom-12 -right-6 h-40 w-40 rounded-full bg-[var(--primitive-accent-soft)]/35 blur-2xl sm:-bottom-16 sm:-right-8 sm:h-56 sm:w-56"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 right-12 h-32 w-32 rounded-full bg-[var(--primitive-coral)]/30 blur-xl sm:-bottom-10 sm:right-24 sm:h-44 sm:w-44"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-3 right-4 flex items-end gap-2 sm:bottom-4 sm:right-8 sm:gap-3"
        aria-hidden
      >
        <div className="glass-surface flex size-14 items-center justify-center rounded-full border-white/70 text-xl font-bold text-primary shadow-lg backdrop-blur-xl sm:size-20 sm:text-2xl">
          0
        </div>
        <div className="glass-surface-dark mb-4 flex size-10 items-center justify-center rounded-full text-base font-semibold text-white shadow-xl sm:mb-6 sm:size-14 sm:text-lg">
          —
        </div>
      </div>
    </section>
  )
}
