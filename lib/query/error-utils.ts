import type { UseQueryResult } from '@tanstack/react-query'

export function queryErrorMessage(error: unknown, fallback = 'Failed to load data') {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function queryRetryProps<TData, TError>(
  query: Pick<UseQueryResult<TData, TError>, 'isError' | 'error' | 'refetch' | 'isFetching'>,
) {
  return {
    hasError: query.isError,
    message: query.isError ? queryErrorMessage(query.error) : undefined,
    retry: () => void query.refetch(),
    isRetrying: query.isFetching,
  }
}
