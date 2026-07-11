import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import {
  DEFAULT_ADMIN_PERMISSIONS,
  permissionsForRole,
  type AdminPermissions,
  type AppRole,
} from '@/types/auth'

const userAuthSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  emailVerified: true,
} as const

export type UserAuthProfile = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: AppRole
  emailVerified: boolean
  permissions?: AdminPermissions
}

let permissionsSchemaReady: boolean | null = null

function isPrismaClientValidationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'PrismaClientValidationError' ||
      error.message.includes('Unknown field') ||
      error.message.includes('Unknown arg'))
  )
}

async function canLoadPermissionFields() {
  if (permissionsSchemaReady !== null) return permissionsSchemaReady

  try {
    await prisma.user.findFirst({
      select: { permCreate: true },
      take: 1,
    })
    permissionsSchemaReady = true
  } catch (error) {
    if (isPrismaClientValidationError(error)) {
      permissionsSchemaReady = false
    } else {
      throw error
    }
  }

  return permissionsSchemaReady
}

async function loadPermissions(userId: string, role: AppRole): Promise<AdminPermissions | undefined> {
  if (role === 'SUPER_ADMIN') {
    return permissionsForRole('SUPER_ADMIN')
  }

  if (!(await canLoadPermissionFields())) {
    return role === 'ADMIN' ? { ...DEFAULT_ADMIN_PERMISSIONS } : undefined
  }

  const row = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      permCreate: true,
      permRead: true,
      permUpdate: true,
      permDelete: true,
    },
  })

  return row ? permissionsForRole(role, row) : undefined
}

export async function loadUserAuthProfile(userId: string): Promise<UserAuthProfile | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...NOT_DELETED },
    select: userAuthSelect,
  })

  if (!user) return null

  const role = user.role as AppRole
  const permissions = await loadPermissions(user.id, role)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role,
    emailVerified: user.emailVerified,
    permissions,
  }
}

export function resetPermissionsSchemaCache() {
  permissionsSchemaReady = null
}
