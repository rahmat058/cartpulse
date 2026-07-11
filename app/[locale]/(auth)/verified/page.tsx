import { Suspense } from 'react'
import { VerifiedClient } from '@/components/auth/VerifiedClient'

export default function VerifiedPage() {
  return (
    <div className="w-full max-w-4xl">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
        <VerifiedClient />
      </Suspense>
    </div>
  )
}
