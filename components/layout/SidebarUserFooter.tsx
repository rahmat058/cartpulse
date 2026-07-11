'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SidebarUserFooter() {
  const { data: session } = useSession()
  const user = session?.user

  if (!user) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        <a href="/login" className="text-teal-600 hover:underline dark:text-teal-400">
          Sign in
        </a>
      </p>
    )
  }

  const initials = (user.name ?? user.email ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-100">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user.name ?? 'User'}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-center gap-2 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
        onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  )
}
