'use client'

import { useCallback, useEffect, useState } from 'react'

interface AdminResourceState<T> {
  data: T
  loading: boolean
  error: string | null
}

interface UseAdminResourceOptions<T> {
  /** Build the request URL from current query state. */
  buildUrl: () => string
  /** Extract the list payload from the JSON response. */
  selectData: (json: unknown) => T
  /** Optional total count for paginated tables. */
  selectTotal?: (json: unknown) => number
  /** Re-fetch when this value changes (filters, pagination, refresh nonce). */
  deps: unknown[]
  initialData: T
}

/**
 * Container hook — standardises admin table data fetching (presenter/container split).
 * Replaces repeated `useEffect` + `fetch` + local loading/error state in admin pages.
 */
export function useAdminResource<T>({
  buildUrl,
  selectData,
  selectTotal,
  deps,
  initialData,
}: UseAdminResourceOptions<T>) {
  const [state, setState] = useState<AdminResourceState<T>>({
    data: initialData,
    loading: true,
    error: null,
  })
  const [total, setTotal] = useState(0)

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }))

    fetch(buildUrl())
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? 'Request failed')
        }
        return response.json()
      })
      .then((json) => {
        setState({
          data: selectData(json),
          loading: false,
          error: null,
        })
        if (selectTotal) {
          setTotal(selectTotal(json))
        }
      })
      .catch((error: unknown) => {
        setState({
          data: initialData,
          loading: false,
          error: error instanceof Error ? error.message : 'Request failed',
        })
      })
  }, [buildUrl, initialData, selectData, selectTotal])

  useEffect(() => {
    reload()
  }, [reload, ...deps])

  return { ...state, total, reload }
}
