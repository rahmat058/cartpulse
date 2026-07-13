import { PrismaClient } from '@/app/generated/prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const accelerateUrl = process.env.DATABASE_ACCELERATE_URL
  if (!accelerateUrl) {
    throw new Error('DATABASE_ACCELERATE_URL is not set (expected a prisma+postgres:// Accelerate URL)')
  }

  // Runtime: Accelerate pool + cacheStrategy. Cast keeps Prisma include/relation inference intact.
  return new PrismaClient({
    accelerateUrl,
  }).$extends(withAccelerate()) as unknown as PrismaClient
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
