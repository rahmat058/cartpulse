/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * Runs on every matched request before route handlers. Responsibilities, in order:
 * 1. Locale-prefixed API fixes — `/bn/api/*` must not hit next-intl (returns HTML for Auth.js).
 * 2. API security — rate limits, origin checks, suspicious URL blocking (see lib/api/guard).
 * 3. Locale routing — next-intl redirects and rewrites for `en` / `bn`.
 * 4. Auth gates — admin, dashboard, and checkout require a signed-in user with the right role.
 *
 * Public catalog GETs skip the NextAuth wrapper so CDN can cache (no Set-Cookie).
 * Auth.js session is available on `req.auth` for page gates because those paths use `auth()`.
 */
import NextAuth from 'next-auth'
import { routing } from '@/i18n/routing'
import { authConfig } from '@/lib/auth.config'
import createIntlMiddleware from 'next-intl/middleware'
import { isPublicCatalogGet } from '@/lib/api/cache-headers'
import { canAccessAdmin, canAccessAdminPath, canAccessDashboard } from '@/lib/auth-access'
import { localeFromPathname, stripLocalePrefix, withLocalePath } from '@/i18n/locale-path'
import { NextResponse, type NextFetchEvent, type NextProxy, type NextRequest } from 'next/server'
import { applyApiGuard, nextApiResponse, nextPublicApiResponse, normalizeApiPath } from '@/lib/api/guard'

const intlMiddleware = createIntlMiddleware(routing)
const { auth } = NextAuth(authConfig)

/**
 * Rewrites or redirects locale-scoped API paths to the real `/api/*` tree.
 * GET/HEAD → redirect (safe, idempotent). Mutations → rewrite (preserve method/body).
 */
function handleLocalePrefixedApi(req: NextRequest) {
  const match = req.nextUrl.pathname.match(/^\/(en|bn)\/api(\/.*)?$/)
  if (!match) return null

  const target = new URL(`/api${match[2] ?? ''}`, req.nextUrl.origin)
  target.search = req.nextUrl.search

  if (req.method === 'GET' || req.method === 'HEAD') {
    return NextResponse.redirect(target)
  }

  const url = req.nextUrl.clone()
  url.pathname = `/api${match[2] ?? ''}`
  return NextResponse.rewrite(url)
}

function handleApiRequest(req: NextRequest) {
  const apiFix = handleLocalePrefixedApi(req)
  if (apiFix) return apiFix

  const apiPath = normalizeApiPath(req.nextUrl.pathname)
  if (!apiPath.startsWith('/api/')) return null

  const blocked = applyApiGuard(req)
  if (blocked) return blocked

  if (isPublicCatalogGet(apiPath, req.method)) {
    return nextPublicApiResponse()
  }

  return nextApiResponse()
}

const handleAuthedPages = auth((req) => {
  const intlResponse = intlMiddleware(req)
  if (intlResponse.headers.has('location')) {
    return intlResponse
  }

  const pathname = req.nextUrl.pathname
  const withoutLocale = stripLocalePrefix(pathname)
  const locale = localeFromPathname(pathname)
  const role = req.auth?.user?.role
  const isLoggedIn = Boolean(req.auth?.user)
  const origin = req.nextUrl.origin

  if (withoutLocale.startsWith('/admin')) {
    if (!canAccessAdmin(role)) {
      const login = new URL(withLocalePath('/login', locale), origin)
      login.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(login)
    }

    if (!canAccessAdminPath(role, withoutLocale)) {
      return NextResponse.redirect(new URL(withLocalePath('/admin', locale), origin))
    }
  }

  if (withoutLocale.startsWith('/dashboard') && !canAccessDashboard(role)) {
    const login = new URL(withLocalePath('/login', locale), origin)
    login.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(login)
  }

  if (withoutLocale === '/checkout' && !isLoggedIn) {
    const login = new URL(withLocalePath('/login', locale), origin)
    login.searchParams.set('callbackUrl', withLocalePath('/checkout', locale))
    return NextResponse.redirect(login)
  }

  return intlResponse
}) as unknown as NextProxy

function needsAuthGate(pathname: string): boolean {
  const withoutLocale = stripLocalePrefix(pathname)
  return withoutLocale.startsWith('/admin') || withoutLocale.startsWith('/dashboard') || withoutLocale === '/checkout'
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const apiResponse = handleApiRequest(req)
  if (apiResponse) return apiResponse

  // Public storefront skips NextAuth so pages can ISR / edge-cache without Set-Cookie.
  if (!needsAuthGate(req.nextUrl.pathname)) {
    return intlMiddleware(req)
  }

  return handleAuthedPages(req, event)
}

export const config = {
  // Include /api so guards run; exclude static assets and Next internals.
  matcher: ['/api/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
}
