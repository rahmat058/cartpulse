/** Decode common HTML entities before stripping tags. */
function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

/** Strip HTML tags — safe for serverless (no jsdom). */
export function stripHtml(html: string): string {
  if (!html?.trim()) return ''

  return decodeBasicEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isHtmlEmpty(html?: string | null): boolean {
  return stripHtml(html ?? '').length === 0
}
