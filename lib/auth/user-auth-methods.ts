import prisma from '@/lib/prisma'
import type { OAuthProviderId } from '@/lib/auth/providers'

export type AuthMethodId = 'credentials' | OAuthProviderId

export function toAuthMethodId(provider: string | undefined | null): AuthMethodId | undefined {
  if (provider === 'credentials' || provider === 'google' || provider === 'github') {
    return provider
  }
  return undefined
}

export function resolveActiveAuthMethod(
  authProvider: AuthMethodId | undefined,
  linkedMethods: AuthMethodId[],
): AuthMethodId | null {
  if (authProvider) return authProvider
  if (linkedMethods.length === 1) return linkedMethods[0]
  return null
}

export type UserAuthMethods = {
  methods: AuthMethodId[]
  hasCredentials: boolean
}

export async function getUserAuthMethods(userId: string): Promise<UserAuthMethods> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      accounts: { select: { provider: true } },
    },
  })

  if (!user) {
    return { methods: [], hasCredentials: false }
  }

  const methods: AuthMethodId[] = []

  if (user.passwordHash) {
    methods.push('credentials')
  }

  for (const account of user.accounts) {
    if (account.provider === 'google' || account.provider === 'github') {
      if (!methods.includes(account.provider)) {
        methods.push(account.provider)
      }
    }
  }

  return {
    methods,
    hasCredentials: Boolean(user.passwordHash),
  }
}
