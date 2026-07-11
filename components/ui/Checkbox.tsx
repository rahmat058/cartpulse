'use client'

import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative flex size-[18px] shrink-0 items-center justify-center rounded-md border-2 border-slate-300 bg-white shadow-sm transition-all outline-none',
        'focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-checked:border-teal-600 data-checked:bg-teal-600 data-checked:text-white',
        'dark:border-slate-600 dark:bg-slate-900 dark:data-checked:border-teal-500 dark:data-checked:bg-teal-500',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-2',
        className,
      )}
      {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5">
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
