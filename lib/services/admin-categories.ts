import prisma from '@/lib/prisma'
import { NOT_DELETED, softDeleteCategoryById } from '@/lib/services/soft-delete'
import {
  buildCategoryTree,
  flattenCategoryTree,
  MAX_CATEGORY_DEPTH,
  maxRelativeDepth,
  type CategoryTreeShape,
} from '@/lib/utils/category-tree'
import { formatCategoryOptionLabel } from '@/lib/utils/category-select'
import type {
  AdminCategoryParentOption,
  AdminCategoryRow,
  AdminCategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/admin'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function getCategoryDepth(categoryId: string): Promise<number> {
  let depth = 1
  let currentId: string | null = categoryId

  while (currentId) {
    const row: { parentId: string | null } | null = await prisma.category.findFirst({
      where: { id: currentId, ...NOT_DELETED },
      select: { parentId: true },
    })

    if (!row) break
    if (!row.parentId) return depth

    depth += 1
    currentId = row.parentId
  }

  return depth
}

async function getSubtreeFromDb(categoryId: string): Promise<CategoryTreeShape | null> {
  const rows = await prisma.category.findMany({
    where: NOT_DELETED,
    include: { _count: { select: { products: { where: NOT_DELETED } } } },
  })

  const tree = buildCategoryTree(
    rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      emoji: row.emoji,
      sortOrder: row.sortOrder,
      parentId: row.parentId,
      productCount: row._count.products,
    })),
  )

  const stack = [...tree]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node.id === categoryId) return node
    stack.push(...node.children)
  }

  return null
}

async function isDescendantOf(ancestorId: string, categoryId: string): Promise<boolean> {
  const subtree = await getSubtreeFromDb(ancestorId)
  if (!subtree) return false

  const stack = [...subtree.children]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node.id === categoryId) return true
    stack.push(...node.children)
  }

  return false
}

function mapCategory(
  row: {
    id: string
    slug: string
    name: string
    description: string | null
    emoji: string | null
    sortOrder: number
    parentId: string | null
    parent?: { name: string } | null
    _count?: { products: number; children: number }
  },
  depth: number,
  pathLabel: string,
): AdminCategoryRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    sortOrder: row.sortOrder,
    parentId: row.parentId,
    parentName: row.parent?.name ?? null,
    productCount: row._count?.products ?? 0,
    childCount: row._count?.children ?? 0,
    depth,
    pathLabel,
  }
}

function mapTreeNode(node: CategoryTreeShape, depth = 1, parentNames: string[] = []): AdminCategoryTreeNode {
  const pathLabel = [...parentNames, node.name].join(' › ')

  return {
    id: node.id,
    slug: node.slug,
    name: node.name,
    emoji: node.emoji,
    sortOrder: node.sortOrder,
    parentId: node.parentId,
    productCount: node.productCount,
    childCount: node.children.length,
    depth,
    pathLabel,
    children: node.children.map((child) => mapTreeNode(child, depth + 1, [...parentNames, node.name])),
  }
}

async function assertValidParent(parentId: string | null | undefined, categoryId?: string) {
  if (!parentId) return

  if (categoryId && parentId === categoryId) {
    throw new Error('A category cannot be its own parent')
  }

  const parent = await prisma.category.findFirst({
    where: { id: parentId, ...NOT_DELETED },
    select: { id: true },
  })

  if (!parent) {
    throw new Error('Parent category not found')
  }

  if (categoryId && (await isDescendantOf(categoryId, parentId))) {
    throw new Error('A category cannot be moved under one of its own subcategories')
  }

  const parentDepth = await getCategoryDepth(parentId)
  if (parentDepth >= MAX_CATEGORY_DEPTH) {
    throw new Error(`Categories can only be nested up to ${MAX_CATEGORY_DEPTH} levels`)
  }

  if (categoryId) {
    const subtree = await getSubtreeFromDb(categoryId)
    if (subtree) {
      const subtreeDepth = maxRelativeDepth(subtree)
      if (parentDepth + subtreeDepth > MAX_CATEGORY_DEPTH) {
        throw new Error(`Moving this category would exceed the ${MAX_CATEGORY_DEPTH}-level limit`)
      }
    }
  }
}

export async function listAdminCategoryTree(): Promise<AdminCategoryTreeNode[]> {
  const rows = await prisma.category.findMany({
    where: NOT_DELETED,
    include: { _count: { select: { products: { where: NOT_DELETED } } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  const tree = buildCategoryTree(
    rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      emoji: row.emoji,
      sortOrder: row.sortOrder,
      parentId: row.parentId,
      productCount: row._count.products,
    })),
  )

  return tree.map((node) => mapTreeNode(node))
}

export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  const tree = await listAdminCategoryTree()
  const flat = flattenCategoryTree(tree)

  const rows = await prisma.category.findMany({
    where: NOT_DELETED,
    include: {
      parent: { select: { name: true } },
      _count: {
        select: {
          products: { where: NOT_DELETED },
          children: { where: NOT_DELETED },
        },
      },
    },
  })

  const rowById = new Map(rows.map((row) => [row.id, row]))

  return flat.map((item) => {
    const row = rowById.get(item.id)!
    return mapCategory(row, item.depth, item.pathLabel)
  })
}

export async function getAdminCategory(id: string): Promise<AdminCategoryRow | null> {
  const rows = await listAdminCategories()
  return rows.find((row) => row.id === id) ?? null
}

export async function listAdminCategoryParents(excludeId?: string): Promise<AdminCategoryParentOption[]> {
  const tree = await listAdminCategoryTree()

  return flattenCategoryTree(tree)
    .filter((item) => item.depth < MAX_CATEGORY_DEPTH)
    .filter((item) => item.id !== excludeId)
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      depth: item.depth,
      emoji: item.emoji,
      label: formatCategoryOptionLabel(item.name, item.emoji, item.depth),
    }))
}

export async function createAdminCategory(input: CreateCategoryInput): Promise<AdminCategoryRow> {
  const slug = slugify(input.slug.trim() || input.name)
  if (!slug) {
    throw new Error('A valid slug is required')
  }

  const existing = await prisma.category.findFirst({
    where: { slug, ...NOT_DELETED },
  })
  if (existing) {
    throw new Error('A category with this slug already exists')
  }

  const parentId = input.parentId?.trim() || null
  await assertValidParent(parentId)

  const row = await prisma.category.create({
    data: {
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      emoji: input.emoji?.trim() || '📦',
      sortOrder: input.sortOrder ?? 0,
      parentId,
    },
    include: {
      parent: { select: { name: true } },
      _count: {
        select: {
          products: { where: NOT_DELETED },
          children: { where: NOT_DELETED },
        },
      },
    },
  })

  const depth = parentId ? await getCategoryDepth(row.id) : 1
  const parentChain: string[] = []
  if (row.parent?.name) parentChain.push(row.parent.name)

  return mapCategory(row, depth, parentChain.length > 0 ? `${parentChain.join(' › ')} › ${row.name}` : row.name)
}

export async function updateAdminCategory(id: string, input: UpdateCategoryInput): Promise<AdminCategoryRow> {
  const existing = await prisma.category.findFirst({
    where: { id, ...NOT_DELETED },
  })

  if (!existing) {
    throw new Error('Category not found')
  }

  if (input.slug) {
    const slug = slugify(input.slug)
    if (!slug) {
      throw new Error('A valid slug is required')
    }

    const conflict = await prisma.category.findFirst({
      where: { slug, ...NOT_DELETED, NOT: { id } },
    })
    if (conflict) {
      throw new Error('A category with this slug already exists')
    }
  }

  const parentId = input.parentId === undefined ? undefined : input.parentId?.trim() ? input.parentId.trim() : null

  if (parentId !== undefined) {
    await assertValidParent(parentId, id)
  }

  const row = await prisma.category.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      slug: input.slug ? slugify(input.slug) : undefined,
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      emoji: input.emoji === undefined ? undefined : input.emoji?.trim() || '📦',
      sortOrder: input.sortOrder,
      parentId,
    },
    include: {
      parent: { select: { name: true } },
      _count: {
        select: {
          products: { where: NOT_DELETED },
          children: { where: NOT_DELETED },
        },
      },
    },
  })

  const depth = await getCategoryDepth(row.id)
  const match = (await listAdminCategories()).find((item) => item.id === row.id)
  return mapCategory(row, depth, match?.pathLabel ?? row.name)
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await softDeleteCategoryById(id)
}
