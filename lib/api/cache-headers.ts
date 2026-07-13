/** CDN-friendly cache for public catalog GETs (Vercel edge + browser). */
export const PUBLIC_CATALOG_CACHE_CONTROL =
  'public, s-maxage=60, stale-while-revalidate=300, max-age=30'

/** Private / mutating API responses must not be stored by shared caches. */
export const PRIVATE_API_CACHE_CONTROL = 'no-store'

export const PUBLIC_CATALOG_API_PATHS = [
  '/api/products',
  '/api/categories',
  '/api/stores',
] as const

export function isPublicCatalogGet(pathname: string, method: string): boolean {
  if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') return false
  if (pathname === '/api/products' || pathname.startsWith('/api/products/')) return true
  if (pathname === '/api/categories') return true
  if (pathname === '/api/stores') return true
  return false
}
