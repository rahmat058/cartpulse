'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { StorageKeys, isStorageFlagSet, setStorageFlag } from '@/lib/storage/client-storage'
import { formatOAuthProviderLabel } from '@/lib/auth/providers'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'

export function PasswordBanner({
  hasPassword,
  authProvider,
}: {
  hasPassword: boolean
  authProvider?: AuthMethodId
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hasPassword) {
      setVisible(false)
      return
    }
    setVisible(!isStorageFlagSet(StorageKeys.passwordBannerDismissed))
  }, [hasPassword])

  if (!visible) return null

  const providerLabel =
    authProvider && authProvider !== 'credentials' ? formatOAuthProviderLabel(authProvider) : null

  function dismiss() {
    setStorageFlag(StorageKeys.passwordBannerDismissed)
    setVisible(false)
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-md border border-teal-100 bg-linear-to-r from-teal-50 to-cyan-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-teal-900/40 dark:from-teal-950/40 dark:to-cyan-950/30">
      <p className="max-w-2xl text-sm text-slate-700 dark:text-slate-200">
        {providerLabel ? (
          <>
            You signed in with <strong>{providerLabel}</strong>. Set a password to also sign in with email —
            you&apos;ll keep the same account and can use either method next time.
          </>
        ) : (
          <>
            Set a password for faster sign-in. Add a password and you can use email + password next time.
          </>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <Link href="/dashboard/profile">
          <Button size="sm">Set password</Button>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
