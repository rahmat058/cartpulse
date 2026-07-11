import { cn } from '@/lib/utils'

export const formControlClass = cn(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
  'placeholder:text-muted-foreground transition-colors outline-none',
  'focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  'dark:bg-input/30',
)

export const formSelectClass = cn(formControlClass, 'h-10 appearance-none')

export const formTextareaClass = cn(formControlClass, 'min-h-[100px] resize-y')

export const formDateTimeClass = cn(
  formControlClass,
  'h-10 min-w-0 pr-2',
  '[&::-webkit-calendar-picker-indicator]:ml-2',
  '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
  '[&::-webkit-calendar-picker-indicator]:rounded-[4px]',
  '[&::-webkit-calendar-picker-indicator]:p-1',
  '[&::-webkit-calendar-picker-indicator]:opacity-70',
  'hover:[&::-webkit-calendar-picker-indicator]:opacity-100',
  '[&::-webkit-datetime-edit]:min-w-0',
  '[&::-webkit-datetime-edit-fields-wrapper]:min-w-0',
)
