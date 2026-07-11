import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Adapter, AdapterUser } from 'next-auth/adapters'
import type { PrismaClient } from '@/app/generated/prisma/client'

/**
 * Auth.js passes OAuth fields (image, emailVerified: null/Date) that do not match
 * our User schema (Boolean emailVerified). Sanitize user creation here.
 */
export function createCartPulseAuthAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma)

  return {
    ...base,
    createUser: async (user) => {
      const { id, emailVerified: _emailVerified, ...data } = user

      const created = await prisma.user.create({
        data: {
          ...data,
          ...(id ? { id } : {}),
        },
      })

      return {
        id: created.id,
        email: created.email,
        name: created.name,
        image: created.image,
        emailVerified: created.emailVerified ? new Date() : null,
      } satisfies AdapterUser
    },
  }
}
