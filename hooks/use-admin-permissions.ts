'use client'

import { useSession } from 'next-auth/react'
import { canPerformAdminAction, isSuperAdmin } from '@/lib/auth-access'
import type { AdminPermission } from '@/types/auth'

export function useAdminPermissions() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const permissions = session?.user?.permissions

  return {
    role,
    isSuperAdmin: isSuperAdmin(role),
    can: (action: AdminPermission) => canPerformAdminAction(role, permissions, action),
  }
}
