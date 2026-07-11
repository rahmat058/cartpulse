import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/app/generated/prisma/client'
import {
  formatFulfillmentStepLabel,
  FULFILLMENT_STEP_COLORS,
  FULFILLMENT_STEPS,
  type FulfillmentStep,
} from '@/lib/orders/order-display'

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50/80 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
        <p className="text-sm font-medium text-rose-700 dark:text-rose-300">This order was cancelled.</p>
        <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-400/80">
          Fulfillment progress is no longer active.
        </p>
      </div>
    )
  }

  const currentIndex = FULFILLMENT_STEPS.indexOf(status as FulfillmentStep)

  return (
    <div>
      <ol className="flex w-full items-center" aria-label="Fulfillment progress">
        {FULFILLMENT_STEPS.map((step, index) => {
          const colors = FULFILLMENT_STEP_COLORS[step]
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <Fragment key={step}>
              <li className="shrink-0 list-none">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isComplete && colors.complete,
                    isCurrent && colors.current,
                    isUpcoming && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {isComplete ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
                </span>
              </li>

              {index < FULFILLMENT_STEPS.length - 1 ? (
                <li
                  className={cn(
                    'mx-2 h-1 min-w-4 flex-1 list-none rounded-full transition-colors',
                    index < currentIndex ? colors.line : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          )
        })}
      </ol>

      <ol className="mt-3 hidden w-full sm:flex" aria-hidden>
        {FULFILLMENT_STEPS.map((step, index) => {
          const colors = FULFILLMENT_STEP_COLORS[step]
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <Fragment key={`${step}-label`}>
              <li className="flex w-9 shrink-0 list-none justify-center">
                <span
                  className={cn(
                    'text-center text-[11px] font-medium uppercase tracking-wide',
                    isComplete && colors.label,
                    isCurrent && cn(colors.label, 'font-semibold'),
                    !isComplete && !isCurrent && 'text-muted-foreground',
                  )}
                >
                  {formatFulfillmentStepLabel(step)}
                </span>
              </li>

              {index < FULFILLMENT_STEPS.length - 1 ? (
                <li className="mx-2 min-w-4 flex-1 list-none" aria-hidden />
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </div>
  )
}
