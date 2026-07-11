import type { Prisma, PrismaClient } from '@/app/generated/prisma/client'
import prisma from '@/lib/prisma'

/**
 * Service layer base — orchestrates repositories and business rules.
 * Keeps API route handlers thin; repositories stay persistence-only.
 */
export abstract class BaseService {
  constructor(protected readonly db: PrismaClient = prisma) {}

  protected transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn)
  }
}
