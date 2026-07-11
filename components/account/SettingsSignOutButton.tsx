'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export function SettingsSignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-rose-200 text-rose-600 hover:bg-rose-50"
      onClick={() => signOut({ callbackUrl: '/' })}>
      Sign out
    </Button>
  )
}
