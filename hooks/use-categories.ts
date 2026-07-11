'use client'

import { useQuery } from '@tanstack/react-query'
import type { CategoryTreeNode } from '@/lib/services/categories'
import { queryKeys } from '@/lib/query/keys'

async function fetchCategories(): Promise<CategoryTreeNode[]> {
  const response = await fetch('/api/categories')
  if (!response.ok) throw new Error('Failed to load categories')
  const json = (await response.json()) as { data: CategoryTreeNode[] }
  return json.data
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 60_000,
  })
}
