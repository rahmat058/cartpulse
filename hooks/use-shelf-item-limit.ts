'use client'

import { useEffect, useState } from 'react'

export const SHELF_MAX_ROWS = 2

export function getShelfColumns(width: number) {
  if (width >= 1024) return 5
  if (width >= 768) return 4
  if (width >= 640) return 3
  return 2
}

export function getShelfItemLimit(width: number, maxRows = SHELF_MAX_ROWS) {
  return getShelfColumns(width) * maxRows
}

/** Matches ProductShelfGrid column breakpoints × max rows. */
export function useShelfItemLimit(maxRows = SHELF_MAX_ROWS) {
  const [limit, setLimit] = useState(() =>
    typeof window !== 'undefined' ? getShelfItemLimit(window.innerWidth, maxRows) : 10,
  )

  useEffect(() => {
    const update = () => setLimit(getShelfItemLimit(window.innerWidth, maxRows))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [maxRows])

  return limit
}
