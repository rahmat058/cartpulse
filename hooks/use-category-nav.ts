'use client'

import { useMemo } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { CategoryCatalog } from '@/lib/commerce/CategoryCatalog'
import type { CategoryNode } from '@/lib/commerce/CategoryCatalog'

/**
 * Adapter hook — maps API category tree into mega-menu `CategoryNode` shape.
 * Wires the documented `CategoryCatalog` facade into client navigation components.
 */
export function useCategoryNav() {
  const query = useCategories()

  const navigation = useMemo<CategoryNode[]>(() => {
    if (query.data && query.data.length > 0) {
      return CategoryCatalog.fromTree(query.data)
    }
    return CategoryCatalog.getFallback()
  }, [query.data])

  return {
    ...query,
    navigation,
  }
}
