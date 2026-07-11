import { format, parseISO } from 'date-fns'

export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function fromDateTimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  return new Date(value).toISOString()
}

export function parseDateTimeLocal(value: string): Date | undefined {
  if (!value.trim()) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function toDateTimeLocalString(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function formatDateRangeDisplay(from: string, to: string): string {
  if (!from && !to) return ''
  if (from && !to) return `${formatDateDisplay(from)} – …`
  if (from && to) {
    if (from === to) return formatDateDisplay(from)
    return `${formatDateDisplay(from)} – ${formatDateDisplay(to)}`
  }
  return ''
}

export function formatDateDisplay(value: string): string {
  if (!value.trim()) return ''
  const date = value.includes('T') ? parseDateTimeLocal(value) : parseISO(value)
  if (!date) return ''
  return format(date, 'MMM d, yyyy')
}

export function formatDateTimeDisplay(value: string): string {
  const date = parseDateTimeLocal(value)
  if (!date) return ''
  return format(date, 'MMM d, yyyy · h:mm aa')
}

export function getTimeParts(value: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  const date = parseDateTimeLocal(value) ?? new Date()
  const hours = date.getHours()
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return { hour12, minute: date.getMinutes(), period }
}

export function combineDateAndTime(date: Date, hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const next = new Date(date)
  let hours = hour12 % 12
  if (period === 'PM') hours += 12
  next.setHours(hours, minute, 0, 0)
  return toDateTimeLocalString(next)
}
