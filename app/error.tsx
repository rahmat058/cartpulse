'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Home, RotateCcw } from 'lucide-react'
import { NotFoundPanel } from '@/components/lottie/NotFoundPanel'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

function ErrorContent({
  message,
  digest,
  reset,
  homeHref,
  homeLabel,
}: {
  message: string
  digest?: string
  reset: () => void
  homeHref: string
  homeLabel: string
}) {
  return (
    <NotFoundPanel
      badge="Error"
      badgeTone="rose"
      title="Something went wrong"
      description={message}
      meta={digest ? `Reference: ${digest}` : undefined}
      actions={
        <>
          <Button type="button" size="lg" className="gap-2.5" onClick={reset}>
            <RotateCcw className="size-5" />
            Try again
          </Button>
          <Link href={homeHref}>
            <Button variant="outline" size="lg" className="gap-2.5">
              <Home className="size-5" />
              {homeLabel}
            </Button>
          </Link>
        </>
      }
    />
  )
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  const message =
    process.env.NODE_ENV === 'development'
      ? error.message || 'An unexpected error occurred.'
      : 'Something went wrong on our end. Please try again.'

  if (isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
        <ErrorContent
          message={message}
          digest={error.digest}
          reset={reset}
          homeHref="/admin"
          homeLabel="Admin home"
        />
      </div>
    )
  }

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <StorefrontShell showFloatingCart={false}>
        <StorefrontContainer as="main">
          <ErrorContent
            message={message}
            digest={error.digest}
            reset={reset}
            homeHref="/"
            homeLabel="Back to home"
          />
        </StorefrontContainer>
      </StorefrontShell>
    </div>
  )
}
