/**
 * Prisma Accelerate `cacheStrategy` presets.
 *
 * Use on **read** queries that are hit often. Skip for auth, writes, and real-time
 * notifications so those always hit the database.
 *
 * Spread via `accelerateArgs(...)` so TypeScript keeps Prisma `include` inference.
 *
 * @example
 * await prisma.order.findMany(
 *   accelerateArgs({ where: { userId }, orderBy: { createdAt: 'desc' } }, ORDER_CACHE),
 * )
 */
export const CATALOG_CACHE = { ttl: 60, swr: 120 } as const
export const CATEGORY_CACHE = { ttl: 300, swr: 600 } as const
export const STORE_CACHE = { ttl: 300, swr: 600 } as const
/** Orders / admin KPIs — short TTL; status changes often. */
export const ORDER_CACHE = { ttl: 30, swr: 60 } as const
export const REVIEW_CACHE = { ttl: 60, swr: 120 } as const
export const COUPON_CACHE = { ttl: 60, swr: 120 } as const
/** Per-user library / wishlist — short so toggles feel fresh. */
export const USER_DATA_CACHE = { ttl: 20, swr: 40 } as const
/** Admin list pages (products, users). */
export const ADMIN_LIST_CACHE = { ttl: 30, swr: 60 } as const

type AccelerateCacheStrategy = { ttl: number; swr?: number; tags?: string[] }

/** Merge Accelerate cacheStrategy into Prisma query args without breaking typings. */
export function accelerateArgs<T extends object>(args: T, cacheStrategy: AccelerateCacheStrategy): T {
  return { ...args, cacheStrategy } as T
}
