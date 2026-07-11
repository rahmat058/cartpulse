import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
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
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'class']

export function normalizeRichTextHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>') return ''
  return html
}

export function sanitizeRichText(html: string): string {
  if (!html?.trim()) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  }).trim()
}

export function stripRichText(html: string): string {
  if (!html?.trim()) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).replace(/\s+/g, ' ').trim()
}

export function isRichTextEmpty(html?: string | null): boolean {
  return stripRichText(html ?? '').length === 0
}
