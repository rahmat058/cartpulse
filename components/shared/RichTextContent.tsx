import { cn } from '@/lib/utils'
import { isRichTextEmpty, sanitizeRichText } from '@/lib/utils/rich-text'

export function RichTextContent({
  html,
  className,
  fallback,
}: {
  html?: string | null
  className?: string
  fallback?: React.ReactNode
}) {
  const sanitized = sanitizeRichText(html ?? '')
  if (isRichTextEmpty(sanitized)) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <div
      className={cn('rich-text-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
