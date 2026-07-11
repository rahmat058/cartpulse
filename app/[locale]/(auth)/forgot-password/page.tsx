import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-4xl">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
