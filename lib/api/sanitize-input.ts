import { stripRichText } from '@/lib/utils/rich-text'

/** Strip HTML/script from plain-text API fields. */
export function sanitizePlainText(value: string): string {
  return stripRichText(value)
}

export function sanitizeJsonInput<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizePlainText(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonInput(item)) as T
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value)) {
      output[key] = sanitizeJsonInput(nested)
    }
    return output as T
  }

  return value
}

export { hasSuspiciousRequestContent } from '@/lib/api/suspicious-request'
