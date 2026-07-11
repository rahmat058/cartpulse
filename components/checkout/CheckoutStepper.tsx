'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const STEPS = [
  { id: 1, label: 'Cart', href: '/cart' },
  { id: 2, label: 'Delivery & Review', href: '/checkout' },
  { id: 3, label: 'Done', href: '/checkout/success' },
] as const

export function CheckoutStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const done = current > step.id
        const active = current === step.id
        const content = (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                done && 'bg-teal-600 text-white',
                active && 'bg-slate-900 text-white dark:bg-teal-500',
                !done && !active && 'bg-slate-200 text-slate-500 dark:bg-slate-800',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : step.id}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                active || done ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400',
              )}
            >
              {step.label}
            </span>
          </span>
        )

        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-4">
            {done || active ? (
              <Link href={step.href} className="hover:opacity-80">
                {content}
              </Link>
            ) : (
              content
            )}
            {index < STEPS.length - 1 && (
              <span className="hidden h-px w-8 bg-slate-200 sm:block dark:bg-slate-700" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
