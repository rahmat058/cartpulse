'use client'

import Link from 'next/link'
import { Home, RotateCcw } from 'lucide-react'
import { NotFoundPanel } from '@/components/lottie/NotFoundPanel'
import { Button } from '@/components/ui/Button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const message =
    process.env.NODE_ENV === 'development'
      ? error.message || 'An unexpected error occurred.'
      : 'Something went wrong on our end. Please try again.'

  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-border bg-card px-6 py-16 text-center">
      <NotFoundPanel
        badge="Error"
        badgeTone="rose"
        title="Something went wrong"
        description={message}
        meta={error.digest ? `Reference: ${error.digest}` : undefined}
        className="py-0 sm:py-0"
        actions={
          <>
            <Button type="button" onClick={reset}>
              <RotateCcw />
              Try again
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                <Home />
                Admin home
              </Button>
            </Link>
          </>
        }
      />
    </div>
  )
}
