import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import {
  buildCategoryTree,
  collectDescendantSlugs,
  findCategoryInTree,
  rollUpCategoryProductCounts,
  type CategoryTreeShape,
} from '@/lib/utils/category-tree'

export type CategoryTreeNode = CategoryTreeShape

async function loadCategoryRows() {
  return prisma.category.findMany({
    where: NOT_DELETED,
    include: {
      _count: {
        select: { products: { where: NOT_DELETED } },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

function mapCategoryRow(row: Awaited<ReturnType<typeof loadCategoryRows>>[number]): CategoryTreeShape {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    emoji: row.emoji,
    sortOrder: row.sortOrder,
    parentId: row.parentId,
    productCount: row._count.products,
    children: [],
  }
}

export async function listCategoryTree(): Promise<CategoryTreeNode[]> {
  const rows = await loadCategoryRows()
  const tree = buildCategoryTree(rows.map(mapCategoryRow))

  for (const root of tree) {
    rollUpCategoryProductCounts(root)
  }

  return tree
}

export async function getCategorySlugsIncludingDescendants(slug: string): Promise<string[]> {
  const tree = await listCategoryTree()
  const match = findCategoryInTree(slug, tree)
  if (!match) return [slug]
  return collectDescendantSlugs(match.node)
}

/** @deprecated Prefer listCategoryTree */
export async function listCategories(options?: { withChildren?: boolean }) {
  if (options?.withChildren) return listCategoryTree()
  return prisma.category.findMany({
    where: NOT_DELETED,
    include: { _count: { select: { products: { where: NOT_DELETED } } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}
