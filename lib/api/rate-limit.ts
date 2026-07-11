type RateLimitBucket = 'auth' | 'write' | 'read'

interface RateLimitRule {
  windowMs: number
  max: number
}

const RULES: Record<RateLimitBucket, RateLimitRule> = {
  auth: { windowMs: 15 * 60 * 1000, max: 25 },
  write: { windowMs: 60 * 1000, max: 90 },
  read: { windowMs: 60 * 1000, max: 240 },
}

/** In-memory sliding window — suitable for single-node dev/small deploys. */
const hits = new Map<string, number[]>()

function prune(key: string, windowMs: number, now: number) {
  const timestamps = hits.get(key) ?? []
  const active = timestamps.filter((t) => now - t < windowMs)
  if (active.length === 0) hits.delete(key)
  else hits.set(key, active)
  return active
}

export function resolveRateLimitBucket(pathname: string, method: string): RateLimitBucket {
  // SessionProvider polls this often — must not share the strict auth mutation limit.
  if (pathname === '/api/auth/session' || pathname === '/api/auth/csrf') {
    return 'read'
  }

  if (pathname.startsWith('/api/auth/') && method !== 'GET' && method !== 'HEAD') {
    return 'auth'
  }

  if (method === 'GET' || method === 'HEAD') return 'read'
  return 'write'
}

export function buildRateLimitKey(ip: string, pathname: string, method: string): string {
  const bucket = resolveRateLimitBucket(pathname, method)
  const scope = pathname.split('/').slice(0, 4).join('/') || pathname
  return `${ip}:${bucket}:${scope}:${method}`
}

export function checkRateLimit(
  key: string,
  bucket: RateLimitBucket,
): {
  allowed: boolean
  retryAfterSec?: number
} {
  const now = Date.now()
  const rule = RULES[bucket]
  const active = prune(key, rule.windowMs, now)

  if (active.length >= rule.max) {
    const oldest = active[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 1000))
    return { allowed: false, retryAfterSec }
  }

  active.push(now)
  hits.set(key, active)
  return { allowed: true }
}

/** Test helper — clears in-memory counters. */
export function resetRateLimitsForTests() {
  hits.clear()
}
