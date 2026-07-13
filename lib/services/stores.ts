import { accelerateArgs, STORE_CACHE } from '@/lib/api/accelerate-cache'
import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import type { StoreInfo } from '@/types/cart'

export type StoreProfile = StoreInfo & {
  productCount: number
  /** Average customer review rating (1–5). Zero when the store has no reviews. */
  averageRating: number
  reviewCount: number
  soldCount: number
  memberSince: number
}

type StoreRow = {
  id: string
  slug: string
  name: string
  description: string | null
  supportEmail: string | null
  logoEmoji: string | null
  logoUrl: string | null
  currency: string
  taxRate: number
  shippingFlat: number
  freeShippingThreshold: number
  verified?: boolean
  createdAt: Date
}

export function mapStore(row: Omit<StoreRow, 'createdAt'> & { createdAt?: Date }): StoreInfo {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    supportEmail: row.supportEmail ?? undefined,
    logoEmoji: row.logoEmoji ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    currency: row.currency,
    taxRate: row.taxRate,
    shippingFlat: row.shippingFlat,
    freeShippingThreshold: row.freeShippingThreshold,
    verified: row.verified,
  }
}

async function buildStoreProfile(row: StoreRow): Promise<StoreProfile> {
  const [productCount, soldCount, reviewAgg] = await Promise.all([
    prisma.product.count({
      where: { storeId: row.id, published: true, ...NOT_DELETED },
    }),
    prisma.orderItem.count({
      where: { product: { storeId: row.id } },
    }),
    prisma.review.aggregate({
      where: { product: { storeId: row.id } },
      _count: true,
      _avg: { rating: true },
    }),
  ])

  const reviewCount = reviewAgg._count
  const averageRating = reviewCount > 0 ? Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10 : 0

  return {
    ...mapStore(row),
    productCount,
    averageRating,
    reviewCount,
    soldCount,
    memberSince: row.createdAt.getFullYear(),
  }
}

export async function listStoreProfiles(): Promise<StoreProfile[]> {
  const rows = await prisma.store.findMany(
    accelerateArgs(
      {
        where: { active: true, ...NOT_DELETED },
        orderBy: [{ verified: 'desc' as const }, { name: 'asc' as const }],
      },
      STORE_CACHE,
    ),
  )

  return Promise.all(rows.map((row) => buildStoreProfile(row)))
}

export async function listStores(activeOnly = true, orderBy: 'name' | 'newest' = 'name') {
  const rows = await prisma.store.findMany(
    accelerateArgs(
      {
        where: {
          ...NOT_DELETED,
          ...(activeOnly ? { active: true } : {}),
        },
        orderBy: orderBy === 'newest' ? { createdAt: 'desc' as const } : { name: 'asc' as const },
        include: {
          _count: {
            select: {
              products: { where: { published: true, ...NOT_DELETED } },
            },
          },
        },
      },
      STORE_CACHE,
    ),
  )

  return rows.map((row) => ({
    ...mapStore(row),
    productCount: row._count.products,
    active: row.active,
  }))
}

export async function listAdminStoresPage(options?: {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  pageSize?: number
}) {
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 10))
  const skip = (page - 1) * pageSize
  const search = options?.search?.trim()
  const status = options?.status ?? 'all'

  const where = {
    ...NOT_DELETED,
    ...(status === 'active' ? { active: true } : {}),
    ...(status === 'inactive' ? { active: false } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.store.count({ where }),
    prisma.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        _count: {
          select: {
            products: { where: { published: true, ...NOT_DELETED } },
          },
        },
      },
    }),
  ])

  return {
    data: rows.map((row) => ({
      ...mapStore(row),
      productCount: row._count.products,
      active: row.active,
    })),
    total,
    page,
    pageSize,
  }
}

export async function getStoreById(storeId: string) {
  const row = await prisma.store.findFirst({ where: { id: storeId, ...NOT_DELETED } })
  return row ? mapStore(row) : null
}

export async function getStoreBySlug(slug: string) {
  const row = await prisma.store.findFirst(
    accelerateArgs({ where: { slug, ...NOT_DELETED } }, STORE_CACHE),
  )
  return row ? mapStore(row) : null
}

export async function getStoreProfile(slug: string): Promise<StoreProfile | null> {
  const row = await prisma.store.findFirst(
    accelerateArgs(
      {
        where: { slug, active: true, ...NOT_DELETED },
      },
      STORE_CACHE,
    ),
  )

  if (!row) return null

  return buildStoreProfile(row)
}

export async function requireStore(storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, ...NOT_DELETED } })
  if (!store) {
    throw new Error('Store not found')
  }
  if (!store.active) {
    throw new Error('Store is inactive')
  }
  return store
}

export async function getDefaultPricingSettings() {
  const store = await prisma.store.findFirst(
    accelerateArgs(
      {
        where: { active: true, ...NOT_DELETED },
        orderBy: { createdAt: 'asc' as const },
      },
      STORE_CACHE,
    ),
  )

  return {
    taxRate: store?.taxRate ?? 0.08,
    shippingFlat: store?.shippingFlat ?? 5.99,
    freeShippingThreshold: store?.freeShippingThreshold ?? 75,
  }
}
