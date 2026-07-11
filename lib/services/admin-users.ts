import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_SUPER_ADMIN_PERMISSIONS,
  permissionsForRole,
  permissionsToUserFields,
  type AdminPermissions,
  type AppRole,
} from '@/types/auth'

export interface UpdateUserRoleInput {
  role: AppRole
  permissions?: AdminPermissions
}

function clearedPermissions() {
  return {
    permCreate: false,
    permRead: false,
    permUpdate: false,
    permDelete: false,
  }
}

function rolePermissionFields(role: AppRole, permissions?: AdminPermissions) {
  if (role === 'USER') return clearedPermissions()
  if (role === 'SUPER_ADMIN') return permissionsToUserFields(DEFAULT_SUPER_ADMIN_PERMISSIONS)
  return permissionsToUserFields(permissions ?? DEFAULT_ADMIN_PERMISSIONS)
}

export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInput,
  actorUserId: string,
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...NOT_DELETED },
    select: { id: true, role: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (userId === actorUserId && input.role !== user.role) {
    throw new Error('You cannot change your own role')
  }

  if (user.role === 'SUPER_ADMIN' && input.role !== 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', ...NOT_DELETED },
    })
    if (superAdminCount <= 1) {
      throw new Error('Cannot demote the last super admin')
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      role: input.role,
      ...rolePermissionFields(input.role, input.permissions),
    },
    include: { _count: { select: { orders: true } } },
  })

  await prisma.session.deleteMany({ where: { userId } })

  return {
    ...updated,
    permissions: permissionsForRole(updated.role as AppRole, updated),
  }
}
