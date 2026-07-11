'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth'
import { AlertCircle, Heart, Mail, ShieldCheck, Truck, UserPlus } from 'lucide-react'

export function RegisterForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const expiredFromLink = searchParams.get('expired') === '1'
  const expiredEmailParam = searchParams.get('email')?.trim().toLowerCase() ?? ''

  const [done, setDone] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState(expiredEmailParam)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [showExpiredBanner, setShowExpiredBanner] = useState(expiredFromLink && Boolean(expiredEmailParam))

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: expiredEmailParam,
      password: '',
    },
  })

  useEffect(() => {
    if (expiredEmailParam) {
      setValue('email', expiredEmailParam)
      setRegisteredEmail(expiredEmailParam)
    }
  }, [expiredEmailParam, setValue])

  async function onSubmit(values: RegisterFormValues) {
    const email = values.email.trim().toLowerCase()

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name.trim(),
        email,
        password: values.password,
      }),
    })

    const json = (await response.json()) as { error?: string; resent?: boolean; message?: string }

    if (!response.ok) {
      setError('root', { message: json.error ?? 'Registration failed' })
      return
    }

    setRegisteredEmail(email)
    setDone(true)
    setShowExpiredBanner(false)
    if (json.resent) {
      setResendMessage(json.message ?? 'A new verification email has been sent.')
    }
  }

  async function resendVerification(targetEmail?: string) {
    const email = (targetEmail ?? registeredEmail).trim().toLowerCase()
    if (!email) return

    setResending(true)
    setResendMessage(null)

    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setResending(false)
    setRegisteredEmail(email)
    setShowExpiredBanner(false)
    setDone(true)
    setResendMessage(
      response.ok
        ? 'Verification email sent. Check your inbox — the new link expires in 24 hours.'
        : 'Could not resend email. Try again in a moment.',
    )
  }

  const expiredBanner = showExpiredBanner && expiredEmailParam && !done && (
    <div className="mb-4 space-y-3 rounded-md border border-amber-200 bg-amber-50/90 px-4 py-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex items-start gap-2 font-semibold">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Verification link expired
      </div>
      <p className="text-amber-900/90 dark:text-amber-200/90">
        Your verification link for <strong>{expiredEmailParam}</strong> expired after 24 hours. Send a new email to
        finish signing up.
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full border-amber-300 bg-white/80 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
        loading={resending}
        onClick={() => void resendVerification(expiredEmailParam)}>
        Send verification email again
      </Button>
    </div>
  )

  return (
    <AuthShell
      title={done ? 'Check your email' : showExpiredBanner ? 'Verification expired' : 'Create account'}
      subtitle={
        done
          ? `We sent a verification link to ${registeredEmail}`
          : showExpiredBanner
            ? 'Request a new link below — verification emails expire after 24 hours.'
            : 'Join CartPulse to checkout, sync your wishlist, and track orders.'
      }
      asideTitle="Start shopping smarter"
      asideDescription="Create a free account to unlock wishlist sync, order tracking, and secure checkout."
      asideItems={[
        { icon: UserPlus, label: 'Free account in under a minute' },
        { icon: Heart, label: 'Save items to your wishlist' },
        { icon: Truck, label: 'Fast delivery on in-stock items' },
        { icon: ShieldCheck, label: 'Secure payments & buyer protection' },
      ]}
      footer={
        !done ? (
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-teal-600 hover:underline dark:text-teal-400">
              Sign in
            </Link>
          </p>
        ) : null
      }>
      {done ? (
        <div className="space-y-4">
          <div className="rounded-md border border-teal-200 bg-teal-50/80 px-4 py-4 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4" />
              Verify your email
            </div>
            <p className="text-teal-800 dark:text-teal-200">
              Click the link in your email to activate your account. Links expire in <strong>24 hours</strong>. After
              verification you&apos;ll be signed in and redirected to your dashboard. If you don't see the email, check
              your <strong>spam</strong> folder or try resending the email.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            loading={resending}
            onClick={() => void resendVerification()}>
            Resend verification email
          </Button>
          {resendMessage ? <p className="text-center text-xs text-slate-500">{resendMessage}</p> : null}
          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="font-medium text-teal-600 hover:underline dark:text-teal-400">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <>
          {expiredBanner}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Full name
              </label>
              <Input id="name" autoComplete="name" {...register('name')} aria-invalid={Boolean(errors.name)} />
              {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p> : null}
            </div>
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
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
              </label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...register('password')}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
              <p className="mt-1 text-xs text-slate-400">At least 8 characters</p>
            </div>
            {errors.root ? <p className="text-sm text-rose-600">{errors.root.message}</p> : null}
            <Button type="submit" size="xl" className="w-full" loading={isSubmitting}>
              {showExpiredBanner ? 'Update account & resend email' : 'Create account'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
