import { Suspense } from 'react'
import { VerifyEmailClient } from '@/components/auth/VerifyEmailClient'

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-4xl">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
        <VerifyEmailClient />
      </Suspense>
    </div>
  )
}
