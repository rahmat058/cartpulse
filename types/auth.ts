export type AppRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export type AdminPermission = 'create' | 'read' | 'update' | 'delete'

export interface AdminPermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  create: true,
  read: true,
  update: true,
  delete: false,
}

export const DEFAULT_SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
}

export function permissionsForRole(
  role: AppRole,
  user?: {
    permCreate: boolean
    permRead: boolean
    permUpdate: boolean
    permDelete: boolean
  },
): AdminPermissions | undefined {
  if (role === 'SUPER_ADMIN') return { ...DEFAULT_SUPER_ADMIN_PERMISSIONS }
  if (role === 'ADMIN') {
    return user ? permissionsFromUser(user) : { ...DEFAULT_ADMIN_PERMISSIONS }
  }
  return undefined
}

export function permissionsFromUser(user: {
  permCreate: boolean
  permRead: boolean
  permUpdate: boolean
  permDelete: boolean
}): AdminPermissions {
  return {
    create: user.permCreate,
    read: user.permRead,
    update: user.permUpdate,
    delete: user.permDelete,
  }
}

export function permissionsToUserFields(permissions: AdminPermissions) {
  return {
    permCreate: permissions.create,
    permRead: permissions.read,
    permUpdate: permissions.update,
    permDelete: permissions.delete,
  }
}
