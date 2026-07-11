'use client'

import { QueryErrorFallback } from '@/components/ui/QueryErrorFallback'

interface CatalogErrorProps {
  message: string
  onRetry?: () => void
}

export function CatalogError({ message, onRetry }: CatalogErrorProps) {
  return (
    <QueryErrorFallback
      title="Could not load products"
      message={message}
      onRetry={onRetry}
    />
  )
}
