import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** First word of a display name, or local-part of an email. */
export function firstNameFrom(name?: string | null, email?: string | null) {
  const fromName = name?.trim().split(/\s+/)[0]
  if (fromName) return fromName
  const fromEmail = email?.trim().split('@')[0]
  return fromEmail || 'Account'
}
