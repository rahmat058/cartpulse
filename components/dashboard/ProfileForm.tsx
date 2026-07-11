'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Lock, UserRound, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ProfileAvatarSection } from '@/components/account/ProfileAvatarSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Card } from '@/components/ui/Card'
import { profileSchemaWithPassword, type ProfileFormValues } from '@/lib/validations/account'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'
import { cn } from '@/lib/utils'

function PasswordMatchHint({
  newPassword,
  confirmPassword,
  hasError,
}: {
  newPassword: string
  confirmPassword: string
  hasError: boolean
}) {
  if (!newPassword || !confirmPassword) return null

  const matches = newPassword === confirmPassword

  if (matches) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5 shrink-0" />
        Passwords match
      </p>
    )
  }

  if (hasError || confirmPassword.length > 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-rose-600">
        <XCircle className="size-3.5 shrink-0" />
        Passwords do not match
      </p>
    )
  }

  return null
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-rose-600">{message}</p>
}

export function ProfileForm({
  hasPassword = true,
  image = null,
  authProvider,
}: {
  hasPassword?: boolean
  image?: string | null
  authProvider?: AuthMethodId
}) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const schema = useMemo(() => profileSchemaWithPassword(hasPassword), [hasPassword])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: session?.user?.name ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword') ?? ''
  const confirmPassword = watch('confirmPassword') ?? ''
  const isChangingPassword = newPassword.trim().length > 0
  const isOAuthSession = Boolean(authProvider && authProvider !== 'credentials')
  const canSetPassword = !hasPassword
  const canChangePassword = hasPassword && !isOAuthSession
  const showPasswordSection = canSetPassword || canChangePassword
  const showSaveButton = canChangePassword || canSetPassword

  useEffect(() => {
    reset({
      name: session?.user?.name ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }, [session?.user?.name, reset])

  async function onSubmit(values: ProfileFormValues) {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        currentPassword: hasPassword ? values.currentPassword || undefined : undefined,
        newPassword: values.newPassword || undefined,
      }),
    })

    const json = (await response.json()) as { error?: string }

    if (!response.ok) {
      toast.error(json.error ?? 'Update failed')
      return
    }

    toast.success(
      canSetPassword && values.newPassword
        ? 'Password set — you can now sign in with email too'
        : hasPassword || !values.newPassword
          ? 'Profile updated'
          : 'Password set successfully',
    )
    reset({
      name: values.name,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    await update()
    if (values.newPassword) {
      router.refresh()
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <ProfileAvatarSection image={image} authProvider={authProvider} />
      <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Account details</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input
                value={session?.user?.email ?? ''}
                disabled
                readOnly
                aria-readonly
                className="bg-slate-50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400"
              />
              <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed here</p>
            </div>
            <div>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                readOnly={isOAuthSession}
                disabled={isOAuthSession}
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
                className={isOAuthSession ? 'bg-slate-50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400' : undefined}
              />
              {isOAuthSession ? (
                <p className="mt-1.5 text-xs text-slate-400">Name is managed by your sign-in provider</p>
              ) : (
                <FieldError message={errors.name?.message} />
              )}
            </div>
          </div>
        </div>

        {showPasswordSection ? (
        <div className="space-y-5 border-t border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {canSetPassword ? 'Set a password' : 'Change password'}
              </p>
              <p className="text-xs text-slate-500">
                {canSetPassword
                  ? isOAuthSession
                    ? 'Add email + password sign-in to your existing account'
                    : 'Create a password to sign in with email'
                  : 'Leave blank to keep your current password'}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {canChangePassword ? (
              <div className="sm:max-w-md">
                <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
                <PasswordInput
                  id="currentPassword"
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  {...register('currentPassword')}
                  aria-invalid={Boolean(errors.currentPassword)}
                />
                <FieldError message={errors.currentPassword?.message} />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...register('newPassword')}
                  aria-invalid={Boolean(errors.newPassword)}
                />
                <FieldError message={errors.newPassword?.message} />
              </div>
              <div>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  {...register('confirmPassword')}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={cn(
                    confirmPassword &&
                      newPassword &&
                      confirmPassword !== newPassword &&
                      'border-rose-300 focus-visible:border-rose-400 dark:border-rose-800',
                    confirmPassword && newPassword && confirmPassword === newPassword &&
                      'border-emerald-300 focus-visible:border-emerald-400 dark:border-emerald-800',
                  )}
                />
                <FieldError message={errors.confirmPassword?.message} />
                <div className="mt-1.5">
                  <PasswordMatchHint
                    newPassword={newPassword}
                    confirmPassword={confirmPassword}
                    hasError={Boolean(errors.confirmPassword)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}

        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {showSaveButton ? (
            <>
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                {canSetPassword ? 'Save password' : 'Save changes'}
              </Button>
              {isChangingPassword ? (
                <p className="mt-2 text-xs text-slate-500">Confirm your new password before saving</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Profile photo and name are synced from your social account when you sign in.
            </p>
          )}
        </div>
      </form>
    </Card>
  )
}
