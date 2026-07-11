import type { Prisma } from '@/app/generated/prisma/client'
import { NOT_DELETED } from '@/lib/core/constants'
import { BaseService } from '@/lib/core/BaseService'
import { SlugHelper } from '@/lib/core/SlugHelper'

type Tx = Prisma.TransactionClient

/**
 * Service layer — transactional soft-delete cascades across catalog entities.
 * Replaces scattered delete helpers with one orchestrated entry point.
 */
export class SoftDeleteService extends BaseService {
  /** Release a unique field so the same value can be reused after soft-delete. */
  releaseUniqueValue(value: string, id: string): string {
    return SlugHelper.releaseUniqueValue(value, id)
  }

  private async cleanupProductAssociations(tx: Tx, productId: string) {
    await tx.review.deleteMany({ where: { productId } })
    await tx.libraryItem.deleteMany({ where: { productId } })
    await tx.wishlistItem.deleteMany({ where: { productId } })
  }

  async softDeleteProductRecord(tx: Tx, product: { id: string; slug: string }) {
    const now = new Date()
    await this.cleanupProductAssociations(tx, product.id)
    await tx.product.update({
      where: { id: product.id },
      data: {
        deletedAt: now,
        published: false,
        slug: this.releaseUniqueValue(product.slug, product.id),
        defaultVariantId: null,
      },
    })
  }

  private async softDeleteProductsByStore(tx: Tx, storeId: string) {
    const products = await tx.product.findMany({
      where: { storeId, ...NOT_DELETED },
      select: { id: true, slug: true },
    })

    for (const product of products) {
      await this.softDeleteProductRecord(tx, product)
    }
  }

  async softDeleteStoreById(id: string): Promise<void> {
    const store = await this.db.store.findFirst({
      where: { id, ...NOT_DELETED },
    })

    if (!store) {
      throw new Error('Store not found')
    }

    await this.transaction(async (tx) => {
      await this.softDeleteProductsByStore(tx, id)
      await tx.store.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          active: false,
          slug: this.releaseUniqueValue(store.slug, store.id),
        },
      })
    })
  }

  private async getCategoryDescendantIds(tx: Tx, categoryId: string): Promise<string[]> {
    const children = await tx.category.findMany({
      where: { parentId: categoryId, ...NOT_DELETED },
      select: { id: true },
    })

    const ids: string[] = []
    for (const child of children) {
      ids.push(child.id)
      ids.push(...(await this.getCategoryDescendantIds(tx, child.id)))
    }
    return ids
  }

  async softDeleteCategoryById(id: string): Promise<void> {
    const category = await this.db.category.findFirst({
      where: { id, ...NOT_DELETED },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    await this.transaction(async (tx) => {
      const descendantIds = await this.getCategoryDescendantIds(tx, id)
      const categoryIds = [id, ...descendantIds]

      const products = await tx.product.findMany({
        where: { categoryId: { in: categoryIds }, ...NOT_DELETED },
        select: { id: true, slug: true },
      })

      for (const product of products) {
        await this.softDeleteProductRecord(tx, product)
      }

      for (const categoryId of [...descendantIds].reverse()) {
        const row = await tx.category.findUnique({ where: { id: categoryId } })
        if (!row || row.deletedAt) continue

        await tx.category.update({
          where: { id: categoryId },
          data: {
            deletedAt: new Date(),
            slug: this.releaseUniqueValue(row.slug, row.id),
          },
        })
      }

      await tx.category.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          slug: this.releaseUniqueValue(category.slug, category.id),
        },
      })
    })
  }

  async softDeleteProductById(id: string): Promise<void> {
    const product = await this.db.product.findFirst({
      where: { id, ...NOT_DELETED },
      select: { id: true, slug: true },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    await this.transaction(async (tx) => {
      await this.softDeleteProductRecord(tx, product)
    })
  }

  async softDeleteCouponById(id: string): Promise<void> {
    const coupon = await this.db.coupon.findFirst({
      where: { id, ...NOT_DELETED },
    })

    if (!coupon) {
      throw new Error('Promo code not found')
    }

    await this.db.coupon.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
        code: this.releaseUniqueValue(coupon.code, coupon.id),
      },
    })
  }

  async softDeleteUserById(id: string, actorUserId?: string): Promise<void> {
    if (actorUserId && actorUserId === id) {
      throw new Error('You cannot delete your own account')
    }

    const user = await this.db.user.findFirst({
      where: { id, ...NOT_DELETED },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'SUPER_ADMIN') {
      const superAdminCount = await this.db.user.count({
        where: { role: 'SUPER_ADMIN', ...NOT_DELETED },
      })
      if (superAdminCount <= 1) {
        throw new Error('Cannot delete the last super admin account')
      }
    }

    if (user.role === 'ADMIN') {
      const adminCount = await this.db.user.count({
        where: { role: 'ADMIN', ...NOT_DELETED },
      })
      if (adminCount <= 1) {
        const superAdminCount = await this.db.user.count({
          where: { role: 'SUPER_ADMIN', ...NOT_DELETED },
        })
        if (superAdminCount === 0) {
          throw new Error('Cannot delete the last admin account')
        }
      }
    }

    await this.transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: id } })
      await tx.account.deleteMany({ where: { userId: id } })
      await tx.wishlistItem.deleteMany({ where: { userId: id } })
      await tx.libraryItem.deleteMany({ where: { userId: id } })
      await tx.review.deleteMany({ where: { userId: id } })

      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          email: this.releaseUniqueValue(user.email, user.id),
        },
      })
    })
  }
}

export const softDeleteService = new SoftDeleteService()
