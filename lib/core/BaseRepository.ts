import type { Prisma, PrismaClient } from '@/app/generated/prisma/client'
import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/core/constants'

/**
 * Repository pattern — base class for Prisma-backed data access.
 * Subclasses own queries, includes, and row-to-domain mapping.
 */
export abstract class BaseRepository {
  /** Active-row filter shared by every repository query. */
  protected readonly activeOnly = NOT_DELETED

  constructor(protected readonly db: PrismaClient = prisma) {}

  /** Run work inside a single database transaction. */
  protected transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn)
  }
}
