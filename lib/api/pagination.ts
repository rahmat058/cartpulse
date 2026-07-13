/** Shared offset pagination helpers for admin tables and APIs. */

export const ADMIN_DEFAULT_PAGE_SIZE = 10
export const ADMIN_MAX_PAGE_SIZE = 100

export function clampPage(value: number | undefined, fallback = 1): number {
  if (!value || !Number.isFinite(value) || value < 1) return fallback
  return Math.floor(value)
}

export function clampPageSize(
  value: number | undefined,
  fallback = ADMIN_DEFAULT_PAGE_SIZE,
  max = ADMIN_MAX_PAGE_SIZE,
): number {
  if (!value || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(1, Math.floor(value)))
}

export function parsePageSearchParams(
  searchParams: URLSearchParams,
  defaults?: { page?: number; pageSize?: number },
): { page: number; pageSize: number; skip: number } {
  const page = clampPage(searchParams.get('page') ? Number(searchParams.get('page')) : defaults?.page)
  const pageSize = clampPageSize(
    searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : defaults?.pageSize,
    defaults?.pageSize ?? ADMIN_DEFAULT_PAGE_SIZE,
  )
  return { page, pageSize, skip: (page - 1) * pageSize }
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}
