import NextAuth from 'next-auth'
import { createCartPulseAuthAdapter } from '@/lib/auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { isTrustedOAuthProvider } from '@/lib/auth/account-linking'
import { authConfig } from '@/lib/auth.config'
import { resolveOAuthEmail } from '@/lib/auth/oauth-email'
import { authTokenId, hashAuthToken } from '@/lib/auth-tokens'
import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import { loadUserAuthProfile } from '@/lib/user-auth-profile'
import { toAuthMethodId, type AuthMethodId } from '@/lib/auth/user-auth-methods'
import type { AppRole, AdminPermissions } from '@/types/auth'

/** After db:reset, do not map by email — stale JWTs must force sign-in again. */
export async function requireSessionUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return loadUserAuthProfile(session.user.id)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: createCartPulseAuthAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        verificationToken: { label: 'Verification Token', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const verificationToken = credentials?.verificationToken?.toString()
        const password = credentials?.password?.toString()

        if (!email) return null

        if (verificationToken) {
          const user = await prisma.user.findFirst({ where: { email, ...NOT_DELETED } })
          if (!user) return null

          const record = await prisma.verificationToken.findFirst({
            where: {
              identifier: authTokenId.oneTimeLogin(user.id),
              token: hashAuthToken(verificationToken),
            },
          })

          if (!record || record.expires < new Date()) return null

          await prisma.verificationToken.delete({
            where: {
              identifier_token: {
                identifier: record.identifier,
                token: record.token,
              },
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        if (!password) return null

        const user = await prisma.user.findFirst({ where: { email, ...NOT_DELETED } })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        if (!user.emailVerified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          ...(user.image ? { image: user.image } : {}),
        },
      })
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!account || account.provider === 'credentials') return true
      if (!isTrustedOAuthProvider(account.provider)) return false

      const email = resolveOAuthEmail(user, profile)
      if (!email) return false

      const existing = await prisma.user.findFirst({
        where: { email, ...NOT_DELETED },
      })

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            emailVerified: true,
            name: existing.name ?? user.name,
            image: user.image ?? existing.image,
          },
        })
        return true
      }

      // Brand-new OAuth user: Prisma adapter creates the User row after signIn returns.
      // Never prisma.user.update(user.id) here — that id is not in the DB yet.
      return true
    },
    async jwt({ token, user, account, trigger, session: updateSession }) {
      if (account?.provider) {
        const authProvider = toAuthMethodId(account.provider)
        if (authProvider) token.authProvider = authProvider
      }

      if (trigger === 'update' && updateSession && 'image' in updateSession) {
        token.picture = updateSession.image ?? null
      }

      if (user?.id) {
        token.sub = user.id
        if (user.email) token.email = user.email
        if (user.image) token.picture = user.image

        const profile = await loadUserAuthProfile(user.id)
        token.role = profile?.role ?? (user.role as AppRole | undefined) ?? 'USER'
        token.isEmailVerified = profile?.emailVerified ?? false
        token.permissions = profile?.permissions
        token.picture = profile?.image ?? user.image ?? token.picture
        return token
      }

      if (!token.sub) return token

      const profile = await loadUserAuthProfile(token.sub)
      if (!profile) {
        delete token.sub
        delete token.role
        delete token.permissions
        delete token.isEmailVerified
        return token
      }

      token.role = profile.role
      token.email = profile.email
      token.isEmailVerified = profile.emailVerified
      token.permissions = profile.permissions
      token.picture = profile.image
      return token
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.role = (token.role as AppRole | undefined) ?? 'USER'
        session.user.permissions = token.permissions as AdminPermissions | undefined
        session.user.isEmailVerified = Boolean(token.isEmailVerified)
        session.user.authProvider = token.authProvider as AuthMethodId | undefined
        session.user.image = (token.picture as string | null | undefined) ?? null
        return session
      }

      // @ts-expect-error clear NextAuth session user payload
      session.user = undefined
      return session
    },
  },
})
