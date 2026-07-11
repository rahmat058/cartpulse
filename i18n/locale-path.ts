import { routing, type AppLocale } from '@/i18n/routing'

export function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) {
      const rest = pathname.slice(locale.length + 1)
      return rest.startsWith('/') ? rest : `/${rest}`
    }
  }
  return pathname
}

export function localeFromPathname(pathname: string): AppLocale {
  const segment = pathname.split('/')[1]
  if (routing.locales.includes(segment as AppLocale)) {
    return segment as AppLocale
  }
  return routing.defaultLocale
}

export function withLocalePath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === routing.defaultLocale && routing.localePrefix === 'as-needed') {
    return normalized
  }
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`
}

export function isProductsPath(pathname: string): boolean {
  return stripLocalePrefix(pathname) === '/products'
}

export function isCatalogSyncPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname)
  return path === '/products' || path.startsWith('/stores/')
}
