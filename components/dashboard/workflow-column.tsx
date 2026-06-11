import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type WorkflowTask = {
  id: string
  title: string
  meta?: string
  active?: boolean
  icon?: LucideIcon
}

type WorkflowColumnProps = {
  title: string
  tasks: WorkflowTask[]
  className?: string
}

export function WorkflowColumn({
  title,
  tasks,
  className,
}: WorkflowColumnProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)}>
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-2.5">
        {tasks.map((task) => {
          const Icon = task.icon
          return (
            <div
              key={task.id}
              className={cn(
                'rounded-[var(--radius-inner)] px-3.5 py-3 transition-[box-shadow,transform] duration-200',
                task.active
                  ? 'glass-panel-dark shadow-lg'
                  : 'glass-panel hover:-translate-y-px'
              )}
            >
              <div className="flex items-center gap-2.5">
                {Icon ? (
                  <span
                    className={cn(
                      'icon-circle size-8 shrink-0 text-xs',
                      task.active && 'icon-circle-active !size-8'
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                ) : (
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      task.active
                        ? 'bg-white/15 text-white'
                        : 'bg-white/80 text-muted-foreground'
                    )}
                  >
                    •
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      task.active ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {task.title}
                  </p>
                  {task.meta ? (
                    <p
                      className={cn(
                        'truncate text-xs',
                        task.active ? 'text-white/60' : 'text-muted-foreground'
                      )}
                    >
                      {task.meta}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
