import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="w-full max-w-4xl">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
