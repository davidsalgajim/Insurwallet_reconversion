'use client'

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
  onTaskSelect?: (taskId: string) => void
  className?: string
}

export function WorkflowColumn({
  title,
  tasks,
  onTaskSelect,
  className,
}: WorkflowColumnProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2 sm:gap-3', className)}>
      <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
        {title}
      </h3>
      <div className="flex flex-col gap-2 sm:gap-2.5">
        {tasks.map((task) => {
          const Icon = task.icon
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onTaskSelect?.(task.id)}
              className={cn(
                'w-full rounded-[var(--radius-inner)] px-3 py-2.5 text-left transition-[box-shadow,transform,background-color] duration-200 sm:px-3.5 sm:py-3',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                task.active
                  ? 'glass-panel-dark shadow-lg'
                  : 'glass-panel hover:-translate-y-px'
              )}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                {Icon ? (
                  <span
                    className={cn(
                      'icon-circle size-7 shrink-0 sm:size-8',
                      task.active && 'icon-circle-active !size-7 sm:!size-8'
                    )}
                  >
                    <Icon className="size-3 sm:size-3.5" strokeWidth={1.5} />
                  </span>
                ) : (
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:size-8',
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
