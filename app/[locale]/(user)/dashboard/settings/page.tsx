import Link from 'next/link'
import { auth } from '@/lib/auth'
import {
  AuthMethodBadges,
  AuthMethodRefreshNote,
  OAuthManagedAccountNote,
} from '@/components/account/AuthMethodBadges'
import { SettingsSignOutButton } from '@/components/account/SettingsSignOutButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getUserAuthMethods, resolveActiveAuthMethod } from '@/lib/auth/user-auth-methods'
import { UserAvatar } from '@/components/account/UserAvatar'

export default async function DashboardSettingsPage() {
  const session = await auth()
  const linked = session?.user?.id
    ? await getUserAuthMethods(session.user.id)
    : { methods: [], hasCredentials: false }

  const activeMethod = resolveActiveAuthMethod(session?.user?.authProvider, linked.methods)
  const signedInWithCredentials = activeMethod === 'credentials'

  const displayName = session?.user?.name?.trim() || 'Account'
  const email = session?.user?.email ?? ''

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Account security and preferences</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={session?.user?.name}
              email={session?.user?.email}
              image={session?.user?.image}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
              <p className="truncate text-sm text-slate-500">{email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {activeMethod ? <AuthMethodBadges method={activeMethod} /> : <AuthMethodRefreshNote />}

          {!signedInWithCredentials && activeMethod ? (
            <OAuthManagedAccountNote method={activeMethod} />
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            {signedInWithCredentials ? (
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">
                  Edit profile & password
                </Button>
              </Link>
            ) : null}
            <SettingsSignOutButton />
          </div>
        </div>
      </Card>
    </div>
  )
}
