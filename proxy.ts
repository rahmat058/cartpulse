/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * Runs on every matched request before route handlers. Responsibilities, in order:
 * 1. Locale-prefixed API fixes — `/bn/api/*` must not hit next-intl (returns HTML for Auth.js).
 * 2. API security — rate limits, origin checks, suspicious URL blocking (see lib/api/guard).
 * 3. Locale routing — next-intl redirects and rewrites for `en` / `bn`.
 * 4. Auth gates — admin, dashboard, and checkout require a signed-in user with the right role.
 *
 * Auth.js session is available on `req.auth` because the handler is wrapped with `auth()`.
 */
import NextAuth from 'next-auth'
import { routing } from '@/i18n/routing'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'
import createIntlMiddleware from 'next-intl/middleware'
import { applyApiGuard, nextApiResponse, normalizeApiPath } from '@/lib/api/guard'
import { canAccessAdmin, canAccessAdminPath, canAccessDashboard } from '@/lib/auth-access'
import { localeFromPathname, stripLocalePrefix, withLocalePath } from '@/i18n/locale-path'

const intlMiddleware = createIntlMiddleware(routing)
const { auth } = NextAuth(authConfig)

/**
 * Rewrites or redirects locale-scoped API paths to the real `/api/*` tree.
 * GET/HEAD → redirect (safe, idempotent). Mutations → rewrite (preserve method/body).
 */
function handleLocalePrefixedApi(req: Parameters<Parameters<typeof auth>[0]>[0]) {
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

export default auth((req) => {
  // --- API: locale fix, then security guard ---
  const apiFix = handleLocalePrefixedApi(req)
  if (apiFix) return apiFix

  const apiPath = normalizeApiPath(req.nextUrl.pathname)
  if (apiPath.startsWith('/api/')) {
    const blocked = applyApiGuard(req)
    if (blocked) return blocked
    return nextApiResponse()
  }

  // --- Pages: locale prefix (e.g. /bn/products) ---
  const intlResponse = intlMiddleware(req)
  if (intlResponse.headers.has('location')) {
    return intlResponse
  }

  // --- Pages: role-based access (paths compared without locale prefix) ---
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
})

export const config = {
  // Include /api so guards run; exclude static assets and Next internals.
  matcher: ['/api/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
}
