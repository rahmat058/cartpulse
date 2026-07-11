'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { AuthShell } from '@/components/auth/AuthShell'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Heart, LayoutDashboard, Loader2, Mail, ShoppingBag } from 'lucide-react'

type VerifyState = 'loading' | 'success' | 'error'

/** Dedupe verify calls — React Strict Mode mounts effects twice in dev. */
const verifyInFlight = new Map<string, Promise<{ ok: boolean; loginToken?: string; error?: string; reason?: string }>>()

async function runVerify(email: string, token: string) {
  const key = `${email}:${token}`
  const existing = verifyInFlight.get(key)
  if (existing) return existing

  const promise = (async () => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })

    const body = (await response.json()) as {
      error?: string
      loginToken?: string
      reason?: string
    }

    if (!response.ok || !body.loginToken) {
      return {
        ok: false,
        error:
          body.error ??
          (body.reason === 'expired'
            ? 'Verification link expired'
            : 'Could not verify your email. Try again or request a new link.'),
        reason: body.reason,
      }
    }

    return { ok: true, loginToken: body.loginToken }
  })()

  verifyInFlight.set(key, promise)
  try {
    return await promise
  } finally {
    verifyInFlight.delete(key)
  }
}

export function VerifyEmailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')?.trim().toLowerCase() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''
  const linkError = searchParams.get('error')

  const [state, setState] = useState<VerifyState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (linkError === 'invalid' || !email || !token) {
      setState('error')
      setErrorMessage('This verification link is invalid. Request a new one from the sign-in page.')
      return
    }

    let cancelled = false

    async function verifyAndSignIn() {
      try {
        const result = await runVerify(email, token)
        if (cancelled) return

        if (!result.ok || !result.loginToken) {
          if (result.reason === 'expired' || result.error?.toLowerCase().includes('expired')) {
            router.replace(`/register?expired=1&email=${encodeURIComponent(email)}`)
            return
          }
          setState('error')
          setErrorMessage(result.error ?? 'Could not verify your email.')
          return
        }

        setState('success')

        const signInResult = await signIn('credentials', {
          email,
          verificationToken: result.loginToken,
          redirect: false,
        })

        if (cancelled) return

        if (signInResult?.error) {
          setState('error')
          setErrorMessage('Email verified, but sign-in failed. Please sign in manually.')
          return
        }

        router.replace('/dashboard')
        router.refresh()
      } catch {
        if (!cancelled) {
          setState('error')
          setErrorMessage('Something went wrong while verifying your email. Please try again.')
        }
      }
    }

    void verifyAndSignIn()

    return () => {
      cancelled = true
    }
  }, [email, token, linkError, router])

  return (
    <AuthShell
      title={
        state === 'loading' ? 'Verifying your email…' : state === 'success' ? 'Email verified!' : 'Verification failed'
      }
      subtitle={
        state === 'loading'
          ? 'Hang tight — we are confirming your account.'
          : state === 'success'
            ? 'Redirecting you to your dashboard…'
            : (errorMessage ?? 'We could not verify your email with this link.')
      }
      asideTitle="Almost there"
      asideDescription="Verify your email to unlock your dashboard, wishlist sync, and secure checkout."
      asideItems={[
        { icon: Mail, label: 'One-click email confirmation' },
        { icon: ShoppingBag, label: 'Browse deals after verification' },
        { icon: Heart, label: 'Wishlist sync enabled' },
        { icon: LayoutDashboard, label: 'Track orders in your dashboard' },
      ]}>
      {state === 'loading' && (
        <div className="flex items-center gap-3 rounded-md border border-teal-200 bg-teal-50/80 px-4 py-6 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          <span>Verifying {email}…</span>
        </div>
      )}

      {state === 'success' && (
        <div className="flex items-center gap-3 rounded-md border border-teal-200 bg-teal-50/80 px-4 py-6 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
          <span>Success! Taking you to your dashboard…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex flex-1 items-center justify-center rounded-md border border-teal-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-teal-700 transition-all hover:border-teal-300 hover:bg-white dark:border-teal-800 dark:bg-slate-900 dark:text-teal-300">
            Back to sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex flex-1 items-center justify-center rounded-md bg-linear-to-r from-teal-500 via-teal-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:via-teal-700 hover:to-cyan-600">
            Create account
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
