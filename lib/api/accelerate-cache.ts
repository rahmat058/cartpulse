/**
 * Prisma Accelerate `cacheStrategy` presets for public storefront reads.
 * Writes / admin / auth queries should omit cacheStrategy (always fresh).
 *
 * Spread into query args via `accelerateArgs(...)` so TypeScript keeps Prisma `include` inference
 * (the Accelerate `$extends` client otherwise widens return types).
 */
export const CATALOG_CACHE = { ttl: 60, swr: 120 } as const
export const CATEGORY_CACHE = { ttl: 300, swr: 600 } as const
export const STORE_CACHE = { ttl: 300, swr: 600 } as const

type AccelerateCacheStrategy = { ttl: number; swr?: number; tags?: string[] }

/** Merge Accelerate cacheStrategy into Prisma query args without breaking typings. */
export function accelerateArgs<T extends object>(args: T, cacheStrategy: AccelerateCacheStrategy): T {
  return { ...args, cacheStrategy } as T
}
