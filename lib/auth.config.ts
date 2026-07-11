import type { NextAuthConfig } from 'next-auth'
import type { AdminPermissions, AppRole } from '@/types/auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user.role as AppRole | undefined) ?? 'USER'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = (token.role as AppRole | undefined) ?? 'USER'
        session.user.permissions = token.permissions as AdminPermissions | undefined
        session.user.isEmailVerified = Boolean(token.isEmailVerified)
      }
      return session
    },
  },
} satisfies NextAuthConfig
