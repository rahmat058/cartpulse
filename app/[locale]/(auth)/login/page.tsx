import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { getOAuthProviders } from '@/lib/auth/providers'

export default function LoginPage() {
  const oauthProviders = getOAuthProviders()

  return (
    <div className="w-full max-w-4xl">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
        <LoginForm oauthProviders={oauthProviders} />
      </Suspense>
    </div>
  )
}
