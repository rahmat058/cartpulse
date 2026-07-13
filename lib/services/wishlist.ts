import { accelerateArgs, CATALOG_CACHE, USER_DATA_CACHE } from '@/lib/api/accelerate-cache'
import prisma from '@/lib/prisma'
import { mapDbProduct } from '@/lib/services/products'

export async function listWishlist(userId: string) {
  const rows = await prisma.wishlistItem.findMany(
    accelerateArgs(
      {
        where: { userId },
        include: {
          product: {
            include: {
              store: true,
              category: true,
              variants: true,
              defaultVariant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' as const },
      },
      USER_DATA_CACHE,
    ),
  )

  return rows
    .filter((row) => row.product.published)
    .map((row) => ({
      id: row.id,
      productId: row.productId,
      createdAt: row.createdAt,
      product: mapDbProduct(row.product),
    }))
}

export async function listWishlistProductIds(userId: string): Promise<string[]> {
  const rows = await prisma.wishlistItem.findMany(
    accelerateArgs(
      {
        where: { userId },
        select: { productId: true },
        orderBy: { createdAt: 'desc' as const },
      },
      USER_DATA_CACHE,
    ),
  )
  return rows.map((row) => row.productId)
}

export async function addWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findFirst(
    accelerateArgs(
      {
        where: { id: productId, published: true },
        select: { id: true },
      },
      CATALOG_CACHE,
    ),
  )
  if (!product) throw new Error('Product not found')

  return prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  })
}

export async function removeWishlistItem(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } })
}

export async function toggleWishlistItem(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  })
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return { wished: false as const }
  }
  await addWishlistItem(userId, productId)
  return { wished: true as const }
}
