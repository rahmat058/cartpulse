import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const toneStyles = {
  teal: {
    card: 'border-teal-200/80 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/50 dark:border-teal-900/50 dark:from-teal-950/40 dark:via-slate-950 dark:to-cyan-950/20',
    icon: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200',
    value: 'text-teal-950 dark:text-teal-50',
  },
  cyan: {
    card: 'border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 via-white to-teal-50/40 dark:border-cyan-900/50 dark:from-cyan-950/40 dark:via-slate-950 dark:to-teal-950/20',
    icon: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200',
    value: 'text-cyan-950 dark:text-cyan-50',
  },
  amber: {
    card: 'border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:border-amber-900/50 dark:from-amber-950/40 dark:via-slate-950 dark:to-orange-950/20',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
    value: 'text-amber-950 dark:text-amber-50',
  },
} as const

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'teal',
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: keyof typeof toneStyles
}) {
  const styles = toneStyles[tone]

  return (
    <div
      className={cn(
        'rounded-md border p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-teal-500/5',
        styles.card,
      )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</p>
          <p className={cn('mt-2 text-3xl font-bold tracking-tight tabular-nums', styles.value)}>{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-md shadow-sm', styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  )
}
