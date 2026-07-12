const SUSPICIOUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /%3Cscript/i,
  /&#x3c;script/i,
]

/** Regex-only URL guard — safe for proxy/middleware (no jsdom/DOMPurify). */
export function hasSuspiciousRequestContent(pathname: string, search: string): boolean {
  const haystack = decodeURIComponent(`${pathname}${search}`)
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(haystack))
}
