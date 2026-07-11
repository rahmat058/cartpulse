import type { AdminPermissions, AppRole } from '@/types/auth'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: AppRole
      permissions?: AdminPermissions
      isEmailVerified: boolean
      authProvider?: AuthMethodId
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: AppRole
    permissions?: AdminPermissions
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AppRole
    permissions?: AdminPermissions
    isEmailVerified?: boolean
    authProvider?: AuthMethodId
    picture?: string | null
  }
}
