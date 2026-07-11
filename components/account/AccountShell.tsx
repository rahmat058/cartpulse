'use client'

import { AccountSidebar } from '@/components/account/AccountSidebar'
import { PasswordBanner } from '@/components/account/PasswordBanner'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

import type { AuthMethodId } from '@/lib/auth/user-auth-methods'

export function AccountShell({
  children,
  hasPassword,
  authProvider,
}: {
  children: React.ReactNode
  hasPassword: boolean
  authProvider?: AuthMethodId
}) {
  return (
    <div className="app-bg flex min-h-screen flex-col">
      <StorefrontShell showFloatingCart={false}>
        <StorefrontContainer className="py-6 lg:py-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl dark:text-slate-100">My Account</h1>

          <PasswordBanner hasPassword={hasPassword} authProvider={authProvider} />

          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            <AccountSidebar />
            <section className="min-h-[420px] min-w-200 rounded-md border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950/80">
              {children}
            </section>
          </div>
        </StorefrontContainer>
      </StorefrontShell>
    </div>
  )
}
