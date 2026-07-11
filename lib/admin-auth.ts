import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { canPerformAdminAction, isAdminPanelUser, isSuperAdmin } from '@/lib/auth-access'
import type { AdminPermission } from '@/types/auth'

/** Standard 403 JSON for admin API routes. */
export function adminForbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

type AdminSessionUser = NonNullable<Session['user']>

/**
 * Guard pattern — returns `{ user }` or a ready-to-return `{ error: NextResponse }`.
 * API routes branch on `'error' in result` instead of throwing.
 */
export function requireAdminSession(session: Session | null): { user: AdminSessionUser } | { error: NextResponse } {
  if (!session?.user?.id) return { error: adminUnauthorized() }
  if (!isAdminPanelUser(session.user.role)) return { error: adminForbidden() }
  return { user: session.user }
}

export function requireAdminAction(
  session: Session | null,
  action: AdminPermission,
): { user: AdminSessionUser } | { error: NextResponse } {
  const result = requireAdminSession(session)
  if ('error' in result) return result

  if (!canPerformAdminAction(result.user.role, result.user.permissions, action)) {
    return { error: adminForbidden(`Missing ${action} permission`) }
  }

  return { user: result.user }
}

export function requireSuperAdminSession(
  session: Session | null,
): { user: AdminSessionUser } | { error: NextResponse } {
  const result = requireAdminSession(session)
  if ('error' in result) return result
  if (!isSuperAdmin(result.user.role)) return { error: adminForbidden() }
  return { user: result.user }
}
