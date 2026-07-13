import { NextResponse } from 'next/server'
import { PRIVATE_API_CACHE_CONTROL, PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/api/cache-headers'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy': 'same-site',
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export function applyPrivateCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', PRIVATE_API_CACHE_CONTROL)
  return response
}

export function applyPublicCatalogCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', PUBLIC_CATALOG_CACHE_CONTROL)
  response.headers.set('CDN-Cache-Control', PUBLIC_CATALOG_CACHE_CONTROL)
  response.headers.set('Vercel-CDN-Cache-Control', PUBLIC_CATALOG_CACHE_CONTROL)
  return response
}

export function apiJson<T>(body: T, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init)
  applySecurityHeaders(response)
  applyPrivateCacheHeaders(response)
  return response
}

/** Public catalog JSON — short CDN + browser cache. */
export function apiJsonPublic<T>(body: T, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init)
  applySecurityHeaders(response)
  applyPublicCatalogCacheHeaders(response)
  return response
}
