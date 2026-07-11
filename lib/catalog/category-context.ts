import type { CategoryTreeNode } from '@/lib/services/categories'
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs'
import { findCategoryInTree } from '@/lib/utils/category-tree'

export type ResolvedCategory = {
  id: string
  slug: string
  name: string
  emoji: string | null
  productCount: number
}

export type CategoryPageContext = {
  current: ResolvedCategory
  parent: ResolvedCategory | null
  root: ResolvedCategory
  breadcrumbs: BreadcrumbItem[]
  relatedCategories: ResolvedCategory[]
  parentHref: string
}

function toResolved(node: {
  id: string
  slug: string
  name: string
  emoji: string | null
  productCount: number
}): ResolvedCategory {
  return {
    id: node.id,
    slug: node.slug,
    name: node.name,
    emoji: node.emoji,
    productCount: node.productCount,
  }
}

export function resolveCategoryPageContext(
  categorySlug: string | undefined,
  tree: CategoryTreeNode[],
): CategoryPageContext | null {
  if (!categorySlug || categorySlug === 'all') return null

  const match = findCategoryInTree(categorySlug, tree)
  if (!match) {
    const label = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

    return {
      current: {
        id: categorySlug,
        slug: categorySlug,
        name: label,
        emoji: null,
        productCount: 0,
      },
      parent: null,
      root: {
        id: categorySlug,
        slug: categorySlug,
        name: label,
        emoji: null,
        productCount: 0,
      },
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Categories', href: '/products' }, { label: label }],
      relatedCategories: [],
      parentHref: '/products',
    }
  }

  const { node, ancestors } = match
  const root = ancestors[ancestors.length - 1] ?? node
  const parent = ancestors[0] ?? null

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/products' },
  ]

  for (const ancestor of [...ancestors].reverse()) {
    breadcrumbs.push({ label: ancestor.name, href: `/products?category=${ancestor.slug}` })
  }
  breadcrumbs.push({ label: node.name })

  const siblingSource = parent ?? root
  const relatedCategories = siblingSource.children
    .filter((item) => item.slug !== node.slug)
    .map(toResolved)

  return {
    current: toResolved(node),
    parent: parent ? toResolved(parent) : null,
    root: toResolved(root),
    breadcrumbs,
    relatedCategories,
    parentHref: parent ? `/products?category=${parent.slug}` : `/products?category=${root.slug}`,
  }
}
