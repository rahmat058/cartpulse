import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireSuperAdminSession } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'
import { updateUserRole } from '@/lib/services/admin-users'
import { NOT_DELETED, softDeleteUserById } from '@/lib/services/soft-delete'
import type { AdminPermissions, AppRole } from '@/types/auth'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireSuperAdminSession(session)
  if ('error' in access) return access.error

  const { id } = await context.params
  const body = (await request.json()) as {
    role?: AppRole
    permissions?: AdminPermissions
  }

  if (!body.role) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 })
  }

  try {
    const user = await updateUserRole(id, { role: body.role, permissions: body.permissions }, access.user.id)
    logAdminActivity(access.user, 'ROLE_CHANGE', 'USER', {
      entityId: user.id,
      entityLabel: user.email,
      summary: `Changed role for ${user.email} to ${body.role}`,
      metadata: { role: body.role, permissions: body.permissions },
    })
    return NextResponse.json({ data: user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireSuperAdminSession(session)
  if ('error' in access) return access.error

  const { id } = await context.params

  try {
    const existing = await prisma.user.findFirst({
      where: { id, ...NOT_DELETED },
      select: { email: true },
    })
    await softDeleteUserById(id, access.user.id)
    logAdminActivity(access.user, 'DELETE', 'USER', {
      entityId: id,
      entityLabel: existing?.email,
      summary: `Deleted user "${existing?.email ?? id}"`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
