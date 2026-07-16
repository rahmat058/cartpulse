'use client'

import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, ShieldCheck, Sparkles, Truck, Zap } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { GitHubIcon, GoogleIcon } from '@/components/auth/OAuthIcons'
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth'
import { formatOAuthProviderLabel, type OAuthProviders } from '@/lib/auth/providers'
import { useVerificationRequiredToast } from '@/components/auth/EmailVerificationGate'
import { hasPendingWishlistProductId } from '@/lib/wishlist-pending'
import { toast } from 'sonner'

type LoginFormProps = {
  oauthProviders?: OAuthProviders
}

const DEMO_ACCOUNTS = [
  {
    label: 'Demo Super Admin',
    email: 'superadmin@platform.com',
    password: 'password123',
  },
  {
    label: 'Demo Admin',
    email: 'admin@platform.com',
    password: 'password123',
  },
  {
    label: 'Demo User',
    email: 'customer@demo.com',
    password: 'password123',
  },
] as const

export function LoginForm({ oauthProviders = { google: false, github: false } }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const resetSuccess = searchParams.get('reset') === '1'
  const errorParam = searchParams.get('error')
  const hasGoogleOAuth = oauthProviders.google
  const hasGitHubOAuth = oauthProviders.github
  const hasAnyOAuth = hasGoogleOAuth || hasGitHubOAuth
  const [pendingWishlist, setPendingWishlist] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [lastEmail, setLastEmail] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function fillDemoAccount(email: string, password: string) {
    setValue('email', email, { shouldValidate: true, shouldDirty: true })
    setValue('password', password, { shouldValidate: true, shouldDirty: true })
  }
  useEffect(() => {
    setPendingWishlist(hasPendingWishlistProductId())
  }, [])

  useVerificationRequiredToast()

  async function resendVerification() {
    if (!lastEmail) return
    setResending(true)
    setResendMessage(null)
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lastEmail }),
    })
    setResending(false)
    setResendMessage(response.ok ? 'Verification email sent.' : 'Could not resend verification email.')
  }

  async function onSubmit(values: LoginFormValues) {
    const email = values.email.trim().toLowerCase()
    setLastEmail(email)
    setNeedsVerification(false)
    setResendMessage(null)

    const result = await signIn('credentials', {
      email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      const statusResponse = await fetch('/api/auth/verification-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: values.password }),
      })
      const status = (await statusResponse.json()) as {
        needsVerification?: boolean
        oauthProvider?: string | null
      }

      if (status.oauthProvider) {
        const providerLabel = formatOAuthProviderLabel(status.oauthProvider)
        setError('root', {
          message: `This account uses ${providerLabel} sign-in. Use the ${providerLabel} button below.`,
        })
        toast.error(`Sign in with ${providerLabel}`, {
          description: 'This email is linked to a social login provider.',
          duration: 6000,
        })
        return
      }

      if (status.needsVerification) {
        setNeedsVerification(true)
        setError('root', { message: 'Please verify your email before signing in.' })
        toast.error('Email not verified', {
          description: 'Check your inbox for the verification link or resend it below.',
          duration: 6000,
        })
        return
      }

      setError('root', { message: 'Invalid email or password' })
      return
    }

    const destination = callbackUrl || '/dashboard'

    router.push(destination)
    router.refresh()
  }

  const verifyErrorMessage =
    errorParam === 'expired_verify_link'
      ? 'Your verification link expired. Sign in after resending a new one.'
      : errorParam === 'invalid_verify_link'
        ? 'Invalid verification link. Register again or contact support.'
        : null

  const oauthErrorMessage =
    errorParam === 'OAuthAccountNotLinked'
      ? 'This email already has an account. Sign in with your email and password, or use the same social provider you signed up with.'
      : errorParam === 'OAuthSignin' || errorParam === 'Configuration'
        ? 'Social sign-in is temporarily unavailable. Try email and password or check your OAuth settings.'
        : errorParam === 'AccessDenied'
          ? 'Sign-in was denied. If this is a new Google or GitHub account, try again — or sign in with email and password if you already registered that way.'
          : null

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back — use a demo account below or sign in with your own credentials."
      asideTitle="Welcome back"
      asideDescription="Sign in to checkout securely, sync your wishlist, and track orders."
      asideItems={[
        { icon: Zap, label: 'Early access to flash sales' },
        { icon: Truck, label: 'Fast delivery on in-stock items' },
        { icon: ShieldCheck, label: '7-day returns · secure checkout' },
        { icon: Sparkles, label: 'Wishlist synced when signed in' },
      ]}
      footer={
        <p className="text-center text-sm text-slate-500">
          New to CartPulse?{' '}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-teal-600 hover:underline dark:text-teal-400">
            Create an account
          </Link>
        </p>
      }>
      {resetSuccess && (
        <p className="mb-4 rounded-md bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
          Password updated successfully. Sign in with your new password.
        </p>
      )}
      {verifyErrorMessage && (
        <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {verifyErrorMessage}
        </p>
      )}
      {oauthErrorMessage && (
        <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {oauthErrorMessage}
        </p>
      )}
      {callbackUrl.startsWith('/checkout') && (
        <p className="mb-4 rounded-md bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
          Sign in to continue to secure checkout.
        </p>
      )}
      {pendingWishlist && (
        <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Sign in to save the item to your wishlist.
        </p>
      )}

      <div className="mb-5 space-y-2.5">
        {DEMO_ACCOUNTS.map((account) => (
          <div
            key={account.email}
            className="flex items-center justify-between gap-3 rounded-md border border-teal-200 bg-teal-50/70 px-3 py-2.5 dark:border-teal-900 dark:bg-teal-950/30">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-teal-700 uppercase dark:text-teal-300">
                {account.label}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-700 dark:text-slate-200">
                <span className="font-medium">{account.email}</span>
                <span className="text-slate-400"> · </span>
                <span className="font-mono">{account.password}</span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-teal-300 bg-white text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-700 dark:bg-slate-950 dark:text-teal-300 dark:hover:bg-teal-950/50"
              onClick={() => fillDemoAccount(account.email, account.password)}>
              Use demo
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-teal-600 hover:underline dark:text-teal-400">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
        </div>
        {errors.root ? <p className="text-sm text-rose-600">{errors.root.message}</p> : null}
        {needsVerification && (
          <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <div className="mb-2 flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
              <Mail className="h-4 w-4" />
              Email not verified
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              loading={resending}
              onClick={() => void resendVerification()}>
              Resend verification email
            </Button>
            {resendMessage ? <p className="mt-2 text-xs text-slate-500">{resendMessage}</p> : null}
          </div>
        )}
        <Button type="submit" size="xl" className="w-full" loading={isSubmitting}>
          Continue
        </Button>
      </form>

      {hasAnyOAuth ? (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-500">or continue with</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className={`grid gap-2 ${hasGoogleOAuth && hasGitHubOAuth ? 'sm:grid-cols-2' : ''}`}>
            {hasGitHubOAuth ? (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => signIn('github', { callbackUrl })}>
                <GitHubIcon />
                GitHub
              </Button>
            ) : null}
            {hasGoogleOAuth ? (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => signIn('google', { callbackUrl })}>
                <GoogleIcon />
                Google
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </AuthShell>
  )
}
