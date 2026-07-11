'use client'

import { cn } from '@/lib/utils'
import { formatCategoryOptionPrefix } from '@/lib/utils/category-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

export type CategorySelectOption = {
  value: string
  name: string
  emoji?: string | null
  depth: number
}

const categorySelectItemClass = cn(
  'rounded-md py-2 pl-3 pr-8 font-medium cursor-pointer',
  'focus:bg-teal-100 focus:text-teal-900 dark:focus:bg-teal-900/40 dark:focus:text-teal-100',
  'data-highlighted:bg-teal-100 data-highlighted:text-teal-900 dark:data-highlighted:bg-teal-900/40 dark:data-highlighted:text-teal-100',
  'data-highlighted:**:text-inherit',
)

export function CategoryOptionLabel({ name, emoji, depth }: { name: string; emoji?: string | null; depth: number }) {
  const prefix = formatCategoryOptionPrefix(depth)

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {prefix ? (
        <span className="text-foreground shrink-0 font-mono text-sm leading-none whitespace-pre">{prefix}</span>
      ) : null}
      <span className="shrink-0 text-base leading-none" aria-hidden>
        {emoji ?? '📦'}
      </span>
      <span className="truncate">{name}</span>
    </span>
  )
}

export function CategoryTreeSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select category',
  allowNone = false,
  noneLabel = 'None (top-level)',
  className,
  id,
  'aria-invalid': ariaInvalid,
}: {
  value: string
  onValueChange: (value: string) => void
  options: CategorySelectOption[]
  placeholder?: string
  allowNone?: boolean
  noneLabel?: string
  className?: string
  id?: string
  'aria-invalid'?: boolean
}) {
  const selected = options.find((option) => option.value === value)
  const selectValue = allowNone && !value ? '__none__' : value || undefined

  return (
    <Select value={selectValue} onValueChange={(next) => onValueChange(next === '__none__' ? '' : (next ?? ''))}>
      <SelectTrigger
        id={id}
        aria-invalid={ariaInvalid}
        className={cn(
          'border-input bg-background dark:bg-input/30 h-10 w-full justify-between rounded-md px-3 py-2',
          className,
        )}>
        <SelectValue placeholder={placeholder}>
          {allowNone && !value ? (
            noneLabel
          ) : selected ? (
            <CategoryOptionLabel name={selected.name} emoji={selected.emoji} depth={selected.depth} />
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72 min-w-(--anchor-width) gap-0 p-1">
        {allowNone ? (
          <SelectItem value="__none__" className={categorySelectItemClass}>
            {noneLabel}
          </SelectItem>
        ) : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={categorySelectItemClass}>
            <CategoryOptionLabel name={option.name} emoji={option.emoji} depth={option.depth} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
