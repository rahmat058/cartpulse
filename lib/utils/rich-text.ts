import { isHtmlEmpty, stripHtml } from '@/lib/utils/strip-html'

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'img',
])

const GLOBAL_ATTRS = new Set(['class', 'href', 'target', 'rel', 'src', 'alt'])

/** Remove tags not on the allowlist and strip event handlers / javascript: URLs. */
export function sanitizeRichText(html: string): string {
  if (!html?.trim()) return ''

  let sanitized = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|input|button|textarea|select)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')

  sanitized = sanitized.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) return ''

    if (match.startsWith('</')) return `</${tag}>`

    const safeAttrs = [...attrs.matchAll(/([a-z0-9:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi)]
      .filter(([, name]) => GLOBAL_ATTRS.has(name.toLowerCase()))
      .map(([full]) => full)
      .join(' ')

    return safeAttrs ? `<${tag} ${safeAttrs}>` : `<${tag}>`
  })

  return sanitized.trim()
}

export function normalizeRichTextHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>') return ''
  return html
}

export function stripRichText(html: string): string {
  return stripHtml(html)
}

export function isRichTextEmpty(html?: string | null): boolean {
  return isHtmlEmpty(html)
}
