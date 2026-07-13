/**
 * Pagination helpers — choose the right style per UI:
 *
 * | Surface                         | Style    | Why                                      |
 * |---------------------------------|----------|------------------------------------------|
 * | Storefront catalog “Load more”  | Cursor   | Infinite scroll; stable under inserts    |
 * | Admin / account data tables     | Offset   | Jump to page N; total count for chrome   |
 *
 * Prisma supports both without schema changes:
 * - Cursor: `cursor` + `skip: 1` + `take` (+ unique orderBy tiebreaker)
 * - Offset: `skip` + `take`
 */

export const ADMIN_DEFAULT_PAGE_SIZE = 10
export const ADMIN_MAX_PAGE_SIZE = 100
export const SEARCH_DEBOUNCE_MS = 800

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
