'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/auth'

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    const email = values.email.trim().toLowerCase()

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      setError('root', { message: 'Could not send reset email' })
      return
    }

    setSubmittedEmail(email)
    setDone(true)
  }

  return (
    <AuthShell
      title={done ? 'Check your inbox' : 'Forgot password?'}
      subtitle={
        done
          ? 'If an account exists for that email, a reset link is on its way.'
          : "Enter your email and we'll send a secure link to reset your password."
      }
      asideTitle="Account recovery"
      asideDescription="We'll email you a secure one-time link. It expires in 1 hour for your protection."
      asideItems={[
        { icon: Mail, label: 'Link sent to your registered email' },
        { icon: KeyRound, label: 'Choose a new password securely' },
        { icon: ShieldCheck, label: 'Your account stays protected' },
      ]}
      footer={
        <p className="text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-teal-600 hover:underline dark:text-teal-400">
            Back to sign in
          </Link>
        </p>
      }>
      {done ? (
        <div className="space-y-4">
          <div className="rounded-md border border-teal-200 bg-teal-50/80 px-4 py-4 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4" />
              Email sent
            </div>
            <p className="text-teal-800 dark:text-teal-200">
              If <strong>{submittedEmail}</strong> is registered, you&apos;ll receive a password reset link shortly.
              Check spam if you don&apos;t see it.
            </p>
          </div>
          <Link href="/login">
            <Button type="button" size="xl" variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email address
            </label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(errors.email)} />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>
          {errors.root ? <p className="text-sm text-rose-600">{errors.root.message}</p> : null}
          <Button type="submit" size="xl" className="w-full" loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
