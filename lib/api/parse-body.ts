import { NextResponse } from 'next/server'
import { sanitizeJsonInput } from '@/lib/api/sanitize-input'
import { apiJson } from '@/lib/api/security-headers'

export const DEFAULT_MAX_JSON_BYTES = 1024 * 1024

export async function parseJsonBody<T = unknown>(
  request: Request,
  options?: { maxBytes?: number; sanitize?: boolean },
): Promise<{ data: T } | { error: NextResponse }> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_JSON_BYTES
  const sanitize = options?.sanitize ?? true

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { error: apiJson({ error: 'Payload too large' }, { status: 413 }) }
  }

  let text = ''
  try {
    text = await request.text()
  } catch {
    return { error: apiJson({ error: 'Unable to read request body' }, { status: 400 }) }
  }

  if (text.length > maxBytes) {
    return { error: apiJson({ error: 'Payload too large' }, { status: 413 }) }
  }

  if (!text.trim()) {
    return { data: {} as T }
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return { error: apiJson({ error: 'Content-Type must be application/json' }, { status: 415 }) }
  }

  try {
    const parsed = JSON.parse(text) as T
    return { data: sanitize ? sanitizeJsonInput(parsed) : parsed }
  } catch {
    return { error: apiJson({ error: 'Invalid JSON body' }, { status: 400 }) }
  }
}
