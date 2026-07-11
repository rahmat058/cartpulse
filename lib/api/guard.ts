import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/api/client-ip'
import { isMutatingMethod, isOriginAllowed } from '@/lib/api/origin-check'
import { hasSuspiciousRequestContent } from '@/lib/api/sanitize-input'
import { apiJson, applySecurityHeaders } from '@/lib/api/security-headers'
import { buildRateLimitKey, checkRateLimit, resolveRateLimitBucket } from '@/lib/api/rate-limit'

export function normalizeApiPath(pathname: string): string {
  const localeMatch = pathname.match(/^\/(en|bn)\/api(\/.*)?$/)
  if (localeMatch) return `/api${localeMatch[2] ?? ''}`
  return pathname
}

function guardsDisabled(): boolean {
  return process.env.API_GUARDS_DISABLED === '1'
}

function isExemptPath(pathname: string): boolean {
  if (pathname.startsWith('/api/webhooks/')) return true
  // Auth.js session/csrf reads — high frequency, handled with read bucket limits.
  if (pathname === '/api/auth/session' || pathname === '/api/auth/csrf') return true
  return false
}

/**
 * Edge/proxy guard — rate limit, origin check (CSRF), suspicious URL patterns.
 * Returns a response to short-circuit, or null to continue to the route handler.
 */
export function applyApiGuard(request: NextRequest): NextResponse | null {
  if (guardsDisabled()) return null

  const pathname = normalizeApiPath(request.nextUrl.pathname)
  if (!pathname.startsWith('/api/')) return null
  if (isExemptPath(pathname)) return null

  if (hasSuspiciousRequestContent(pathname, request.nextUrl.search)) {
    return apiJson({ error: 'Invalid request' }, { status: 400 })
  }

  const method = request.method.toUpperCase()
  const bucket = resolveRateLimitBucket(pathname, method)
  const rateKey = buildRateLimitKey(getClientIp(request), pathname, method)
  const rate = checkRateLimit(rateKey, bucket)

  if (!rate.allowed) {
    const response = apiJson({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    if (rate.retryAfterSec) response.headers.set('Retry-After', String(rate.retryAfterSec))
    return response
  }

  if (isMutatingMethod(method) && !isOriginAllowed(request)) {
    return apiJson({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

/** Attach security headers to a proxied API response. */
export function nextApiResponse(): NextResponse {
  return applySecurityHeaders(NextResponse.next())
}
