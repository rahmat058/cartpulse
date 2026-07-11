export const MAX_CATEGORY_DEPTH = 3

export type CategoryTreeShape = {
  id: string
  slug: string
  name: string
  emoji: string | null
  sortOrder: number
  parentId: string | null
  productCount: number
  children: CategoryTreeShape[]
}

export type FlatCategoryRow = CategoryTreeShape & {
  depth: number
  pathLabel: string
}

export function buildCategoryTree<
  T extends {
    id: string
    slug: string
    name: string
    emoji: string | null
    sortOrder: number
    parentId: string | null
    productCount: number
  },
>(rows: T[]): CategoryTreeShape[] {
  const nodes = new Map(
    rows.map((row) => [
      row.id,
      {
        ...row,
        children: [] as CategoryTreeShape[],
      },
    ]),
  )

  const roots: CategoryTreeShape[] = []

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node)
    } else if (!node.parentId) {
      roots.push(node)
    }
  }

  const sortNodes = (items: CategoryTreeShape[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    for (const item of items) sortNodes(item.children)
  }

  sortNodes(roots)
  return roots
}

export function rollUpCategoryProductCounts(node: CategoryTreeShape): number {
  const childTotal = node.children.reduce((sum, child) => sum + rollUpCategoryProductCounts(child), 0)
  node.productCount += childTotal
  return node.productCount
}

export function flattenCategoryTree(
  nodes: CategoryTreeShape[],
  depth = 1,
  parentNames: string[] = [],
): FlatCategoryRow[] {
  const rows: FlatCategoryRow[] = []

  for (const node of nodes) {
    const pathLabel = [...parentNames, node.name].join(' › ')
    rows.push({
      ...node,
      depth,
      pathLabel,
    })

    if (node.children.length > 0) {
      rows.push(...flattenCategoryTree(node.children, depth + 1, [...parentNames, node.name]))
    }
  }

  return rows
}

export function collectDescendantSlugs(node: CategoryTreeShape): string[] {
  const slugs = [node.slug]
  for (const child of node.children) {
    slugs.push(...collectDescendantSlugs(child))
  }
  return slugs
}

export function findCategoryInTree(
  slug: string,
  nodes: CategoryTreeShape[],
): { node: CategoryTreeShape; ancestors: CategoryTreeShape[] } | null {
  for (const node of nodes) {
    if (node.slug === slug) {
      return { node, ancestors: [] }
    }

    const match = findCategoryInTree(slug, node.children)
    if (match) {
      return { node: match.node, ancestors: [node, ...match.ancestors] }
    }
  }

  return null
}

export function maxRelativeDepth(node: CategoryTreeShape): number {
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map((child) => maxRelativeDepth(child)))
}
