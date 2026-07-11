'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, password: values.password }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setError('root', { message: body.error ?? 'Could not reset password' })
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login?reset=1'), 2500)
  }

  if (!email || !token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This link may have expired or already been used."
        asideTitle="Need a new link?"
        asideDescription="Request a fresh password reset email from the sign-in page."
        asideItems={[
          { icon: KeyRound, label: 'Links expire after 1 hour' },
          { icon: ShieldCheck, label: 'One-time use for security' },
          { icon: Lock, label: 'Choose a strong new password' },
        ]}>
        <div className="space-y-4">
          <p className="text-sm text-rose-600">The reset link is invalid or incomplete.</p>
          <Link href="/forgot-password">
            <Button type="button" size="xl" className="w-full">
              Request a new reset link
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={done ? 'Password updated!' : 'Set a new password'}
      subtitle={done ? 'Redirecting you to sign in…' : `Choose a strong password for ${email}`}
      asideTitle="Secure your account"
      asideDescription="Pick a password you haven't used elsewhere. You'll get a confirmation email when it's updated."
      asideItems={[
        { icon: Lock, label: 'Minimum 8 characters' },
        { icon: ShieldCheck, label: 'Encrypted and stored securely' },
        { icon: CheckCircle2, label: 'Confirmation email on success' },
      ]}>
      {done ? (
        <div className="flex items-center gap-3 rounded-md border border-teal-200 bg-teal-50/80 px-4 py-6 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
          <span>Your password was updated. Taking you to sign in…</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              New password
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              {...register('password')}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Confirm password
            </label>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              {...register('confirm')}
              aria-invalid={Boolean(errors.confirm)}
            />
            {errors.confirm ? <p className="mt-1 text-xs text-rose-600">{errors.confirm.message}</p> : null}
          </div>
          {errors.root ? <p className="text-sm text-rose-600">{errors.root.message}</p> : null}
          <Button type="submit" size="xl" className="w-full" loading={isSubmitting}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
