import { DEFAULT_ADMIN_PERMISSIONS } from '@/types/auth'
import type { AdminPermissions, AdminPermission, AppRole } from '@/types/auth'

export type { AppRole, AdminPermission, AdminPermissions }

/** Super-admin-only admin routes — enforced by proxy.ts and API guards. */
export const SUPER_ADMIN_ONLY_PATHS = ['/admin/users', '/admin/analytics', '/admin/activity', '/admin/settings'] as const

export function isSuperAdmin(role: AppRole | undefined): boolean {
  return role === 'SUPER_ADMIN'
}

export function isAdmin(role: AppRole | undefined): boolean {
  return role === 'ADMIN'
}

/** True when the user may access any `/admin/*` route. */
export function isAdminPanelUser(role: AppRole | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

/** Route protection — `/dashboard/*` is available to customers and admins. */
export function canAccessDashboard(role: AppRole | undefined): boolean {
  return role === 'USER' || isAdminPanelUser(role)
}

/** Route protection — non-admins are redirected away from `/admin/*`. */
export function canAccessAdmin(role: AppRole | undefined): boolean {
  return isAdminPanelUser(role)
}

export function isSuperAdminOnlyPath(pathname: string): boolean {
  return SUPER_ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function canAccessAdminPath(role: AppRole | undefined, pathname: string): boolean {
  if (!canAccessAdmin(role)) return false
  if (isSuperAdmin(role)) return true
  if (isSuperAdminOnlyPath(pathname)) return false
  return true
}

export function canPerformAdminAction(
  role: AppRole | undefined,
  permissions: AdminPermissions | undefined,
  action: AdminPermission,
): boolean {
  if (isSuperAdmin(role)) return true
  if (!isAdmin(role)) return false
  if (!permissions) return DEFAULT_ADMIN_PERMISSIONS[action]
  return permissions[action]
}
