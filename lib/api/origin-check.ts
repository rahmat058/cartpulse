const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function collectAllowedOrigins(): Set<string> {
  const allowed = new Set<string>(['http://localhost:3000', 'http://127.0.0.1:3000'])

  for (const envKey of ['NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL', 'APP_URL'] as const) {
    const value = process.env[envKey]
    if (!value) continue
    try {
      allowed.add(new URL(value).origin)
    } catch {
      // ignore invalid env URL
    }
  }

  if (process.env.VERCEL_URL) {
    allowed.add(`https://${process.env.VERCEL_URL}`)
  }

  return allowed
}

let cachedOrigins: Set<string> | null = null

function allowedOrigins(): Set<string> {
  if (!cachedOrigins) cachedOrigins = collectAllowedOrigins()
  return cachedOrigins
}

export function isMutatingMethod(method: string): boolean {
  return MUTATING.has(method.toUpperCase())
}

export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (origin) {
    return allowedOrigins().has(origin)
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      return allowedOrigins().has(new URL(referer).origin)
    } catch {
      return false
    }
  }

  // Non-browser clients (mobile apps, server jobs) may omit both headers.
  return process.env.NODE_ENV !== 'production'
}
