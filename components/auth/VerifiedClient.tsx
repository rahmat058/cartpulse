'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CheckCircle2, Heart, LayoutDashboard, Loader2, ShoppingBag } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'

export function VerifiedClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid verification link. Please sign in or request a new verification email.')
      return
    }

    let cancelled = false

    async function completeSignIn() {
      const result = await signIn('credentials', {
        email,
        verificationToken: token,
        redirect: false,
      })

      if (cancelled) return

      if (result?.error) {
        setError('Your verification link expired. Sign in or request a new verification email.')
        return
      }

      router.replace('/dashboard')
      router.refresh()
    }

    void completeSignIn()

    return () => {
      cancelled = true
    }
  }, [email, token, router])

  return (
    <AuthShell
      title={error ? 'Verification issue' : 'Email verified!'}
      subtitle={error ? error : 'Signing you in and redirecting to your dashboard…'}
      asideTitle="You're all set"
      asideDescription="Your CartPulse account is verified. Browse deals, sync your wishlist, and track orders."
      asideItems={[
        { icon: CheckCircle2, label: 'Email verified successfully' },
        { icon: ShoppingBag, label: 'Start browsing deals' },
        { icon: Heart, label: 'Wishlist sync enabled' },
        { icon: LayoutDashboard, label: 'Track orders in your dashboard' },
      ]}>
      {!error ? (
        <div className="flex items-center gap-3 rounded-md border border-teal-200 bg-teal-50/80 px-4 py-6 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <span>Setting up your session…</span>
        </div>
      ) : (
        <p className="text-sm text-rose-600">{error}</p>
      )}
    </AuthShell>
  )
}
