'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { DayPicker, type DateRange as DayPickerDateRange } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formControlClass } from '@/lib/utils/form-controls'
import {
  combineDateAndTime,
  formatDateDisplay,
  formatDateRangeDisplay,
  formatDateTimeDisplay,
  getTimeParts,
  parseDateTimeLocal,
  toDateTimeLocalString,
} from '@/lib/utils/datetime-picker'
import 'react-day-picker/style.css'

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

type PickerMode = 'date' | 'datetime'

type PopoverAlign = 'start' | 'end'

type BasePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
  size?: 'sm' | 'default'
  align?: PopoverAlign
  'aria-invalid'?: boolean
}

function usePickerPopover() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return { open, setOpen, containerRef }
}

function PickerTrigger({
  id,
  displayValue,
  placeholder,
  disabled,
  clearable,
  hasValue,
  ariaInvalid,
  onOpen,
  onClear,
  size = 'default',
  open = false,
}: {
  id?: string
  displayValue: string
  placeholder: string
  disabled?: boolean
  clearable?: boolean
  hasValue: boolean
  ariaInvalid?: boolean
  onOpen: () => void
  onClear: () => void
  size?: 'sm' | 'default'
  open?: boolean
}) {
  return (
    <div
      className={cn(
        formControlClass,
        'relative flex items-center gap-1 px-3 transition-colors',
        size === 'sm' ? 'h-9 text-sm' : 'h-10',
        open && 'border-teal-500 ring-2 ring-teal-500/20',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-invalid={ariaInvalid}
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className={cn('min-w-0 flex-1 truncate', !displayValue && 'text-muted-foreground')}>
          {displayValue || placeholder}
        </span>
        <Calendar className={cn('h-4 w-4 shrink-0', open ? 'text-teal-600' : 'text-muted-foreground')} />
      </button>
      {clearable && hasValue ? (
        <button
          type="button"
          aria-label="Clear"
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-9 -translate-y-1/2 rounded-sm p-0.5 transition-colors"
          onClick={(event) => {
            event.stopPropagation()
            onClear()
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function TimeColumn({
  label,
  values,
  selected,
  formatValue,
  onSelect,
}: {
  label: string
  values: number[]
  selected: number
  formatValue: (value: number) => string
  onSelect: (value: number) => void
}) {
  const listId = useId()

  return (
    <div className="date-picker-time-column" role="listbox" aria-label={label} id={listId}>
      {values.map((value) => {
        const isSelected = value === selected
        return (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(value)}
            className={cn(
              'date-picker-time-option',
              isSelected && 'date-picker-time-option--active',
            )}
          >
            {formatValue(value)}
          </button>
        )
      })}
    </div>
  )
}

function DatePickerPopover({
  mode,
  align,
  selectedDate,
  timeParts,
  onSelectDate,
  onTimeChange,
  onClear,
  onToday,
}: {
  mode: PickerMode
  align: PopoverAlign
  selectedDate?: Date
  timeParts: { hour12: number; minute: number; period: 'AM' | 'PM' }
  onSelectDate: (date: Date | undefined) => void
  onTimeChange: (parts: { hour12: number; minute: number; period: 'AM' | 'PM' }) => void
  onClear: () => void
  onToday: () => void
}) {
  return (
    <div
      className={cn(
        'date-picker-popover absolute top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-teal-100 bg-card shadow-lg shadow-teal-500/10',
        align === 'end' ? 'right-0 left-auto' : 'left-0 right-auto',
        mode === 'datetime' ? 'date-picker-popover--datetime' : '',
      )}
    >
      <div className={cn('flex', mode === 'datetime' && 'divide-x divide-border')}>
        <div className="p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            className="date-picker-calendar"
          />
        </div>

        {mode === 'datetime' ? (
          <div className="date-picker-time-panel flex min-w-0">
            <TimeColumn
              label="Hour"
              values={HOURS}
              selected={timeParts.hour12}
              formatValue={(value) => String(value).padStart(2, '0')}
              onSelect={(hour12) => onTimeChange({ ...timeParts, hour12 })}
            />
            <TimeColumn
              label="Minute"
              values={MINUTES}
              selected={timeParts.minute}
              formatValue={(value) => String(value).padStart(2, '0')}
              onSelect={(minute) => onTimeChange({ ...timeParts, minute })}
            />
            <TimeColumn
              label="AM or PM"
              values={[0, 1]}
              selected={timeParts.period === 'PM' ? 1 : 0}
              formatValue={(value) => (value === 1 ? 'PM' : 'AM')}
              onSelect={(value) =>
                onTimeChange({ ...timeParts, period: value === 1 ? 'PM' : 'AM' })
              }
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <button
          type="button"
          className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
          onClick={onClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
          onClick={onToday}
        >
          Today
        </button>
      </div>
    </div>
  )
}

function DatePickerBase({
  mode,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  disabled,
  clearable = true,
  size = 'default',
  align = 'start',
  id,
  'aria-invalid': ariaInvalid,
}: BasePickerProps & { mode: PickerMode }) {
  const { open, setOpen, containerRef } = usePickerPopover()

  const selectedDate = value
    ? mode === 'datetime'
      ? parseDateTimeLocal(value)
      : parseISO(value)
    : undefined

  const [timeParts, setTimeParts] = useState(() => getTimeParts(value))

  useEffect(() => {
    if (value) setTimeParts(getTimeParts(value))
  }, [value])

  const displayValue =
    mode === 'datetime' ? formatDateTimeDisplay(value) : formatDateDisplay(value)

  function commitDate(date: Date | undefined, parts = timeParts) {
    if (!date) {
      onChange('')
      return
    }

    if (mode === 'date') {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
      onBlur?.()
      return
    }

    onChange(combineDateAndTime(date, parts.hour12, parts.minute, parts.period))
  }

  function handleSelectDate(date: Date | undefined) {
    if (!date) return
    commitDate(date)
    if (mode === 'datetime') setOpen(true)
  }

  function handleTimeChange(parts: { hour12: number; minute: number; period: 'AM' | 'PM' }) {
    setTimeParts(parts)
    const baseDate = selectedDate ?? new Date()
    commitDate(baseDate, parts)
  }

  function handleClear() {
    onChange('')
    setOpen(false)
    onBlur?.()
  }

  function handleToday() {
    const today = new Date()
    if (mode === 'date') {
      onChange(format(today, 'yyyy-MM-dd'))
      setOpen(false)
      onBlur?.()
      return
    }

    const parts = getTimeParts(toDateTimeLocalString(today))
    setTimeParts(parts)
    onChange(combineDateAndTime(today, parts.hour12, parts.minute, parts.period))
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <PickerTrigger
        id={id}
        displayValue={displayValue}
        placeholder={placeholder ?? (mode === 'datetime' ? 'Select date and time' : 'Pick a date')}
        disabled={disabled}
        clearable={clearable}
        hasValue={Boolean(value)}
        ariaInvalid={ariaInvalid}
        onOpen={() => !disabled && setOpen((current) => !current)}
        onClear={handleClear}
        size={size}
        open={open}
      />

      {open ? (
        <DatePickerPopover
          mode={mode}
          align={align}
          selectedDate={selectedDate}
          timeParts={timeParts}
          onSelectDate={handleSelectDate}
          onTimeChange={handleTimeChange}
          onClear={handleClear}
          onToday={handleToday}
        />
      ) : null}
    </div>
  )
}

export function DatePicker(props: BasePickerProps) {
  return <DatePickerBase mode="date" {...props} />
}

export function DateTimePicker(props: BasePickerProps) {
  return <DatePickerBase mode="datetime" {...props} />
}

export function DateRangePicker({
  from,
  to,
  onChange,
  size = 'sm',
  placeholder = 'Select date range',
  align = 'start',
  className,
}: {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  size?: 'sm' | 'default'
  placeholder?: string
  align?: PopoverAlign
  className?: string
}) {
  const { open, setOpen, containerRef } = usePickerPopover()

  const selectedRange: DayPickerDateRange | undefined =
    from || to
      ? {
          from: from ? parseISO(from) : undefined,
          to: to ? parseISO(to) : undefined,
        }
      : undefined

  const displayValue = formatDateRangeDisplay(from, to)
  const hasValue = Boolean(from || to)

  function handleClear() {
    onChange({ from: '', to: '' })
    setOpen(false)
  }

  function handleToday() {
    const today = format(new Date(), 'yyyy-MM-dd')
    onChange({ from: today, to: today })
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <PickerTrigger
        displayValue={displayValue}
        placeholder={placeholder}
        clearable
        hasValue={hasValue}
        onOpen={() => setOpen((current) => !current)}
        onClear={handleClear}
        size={size}
        open={open}
      />

      {open ? (
        <div
          className={cn(
            'date-picker-popover absolute top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-teal-100 bg-card shadow-lg shadow-teal-500/10',
            align === 'end' ? 'right-0 left-auto' : 'left-0 right-auto',
          )}
        >
          <div className="p-3">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={(range) => {
                onChange({
                  from: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
                  to: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
                })
                if (range?.from && range?.to) {
                  setOpen(false)
                }
              }}
              className="date-picker-calendar"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <button
              type="button"
              className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
              onClick={handleToday}
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
