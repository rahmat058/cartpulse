import prisma from '@/lib/prisma'
import { deleteCloudinaryImage } from '@/lib/cloudinary'
import { NOT_DELETED, softDeleteStoreById } from '@/lib/services/soft-delete'
import type { AdminStoreRow, CreateStoreInput, UpdateStoreInput } from '@/types/admin'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mapAdminStore(row: {
  id: string
  slug: string
  name: string
  description: string | null
  supportEmail: string | null
  logoEmoji: string
  logoUrl: string | null
  currency: string
  taxRate: number
  shippingFlat: number
  freeShippingThreshold: number
  verified: boolean
  active: boolean
  _count?: { products: number }
}): AdminStoreRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    supportEmail: row.supportEmail,
    logoEmoji: row.logoEmoji,
    logoUrl: row.logoUrl,
    currency: row.currency,
    taxRate: row.taxRate,
    shippingFlat: row.shippingFlat,
    freeShippingThreshold: row.freeShippingThreshold,
    verified: row.verified,
    active: row.active,
    productCount: row._count?.products,
  }
}

export async function getAdminStore(id: string): Promise<AdminStoreRow | null> {
  const row = await prisma.store.findFirst({
    where: { id, ...NOT_DELETED },
    include: {
      _count: {
        select: { products: { where: NOT_DELETED } },
      },
    },
  })

  return row ? mapAdminStore(row) : null
}

export async function createStore(input: CreateStoreInput): Promise<AdminStoreRow> {
  const slug = slugify(input.slug.trim() || input.name)
  if (!slug) {
    throw new Error('A valid slug is required')
  }

  const existing = await prisma.store.findFirst({ where: { slug, ...NOT_DELETED } })
  if (existing) {
    throw new Error('A store with this slug already exists')
  }

  const row = await prisma.store.create({
    data: {
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      supportEmail: input.supportEmail?.trim() || null,
      logoEmoji: input.logoEmoji.trim() || '🛍️',
      logoUrl: input.logoUrl?.trim() || null,
      currency: input.currency?.trim() || 'USD',
      taxRate: input.taxRate ?? 0.08,
      shippingFlat: input.shippingFlat ?? 5.99,
      freeShippingThreshold: input.freeShippingThreshold ?? 75,
      active: input.active ?? true,
      verified: input.verified ?? false,
    },
    include: {
      _count: {
        select: { products: { where: NOT_DELETED } },
      },
    },
  })

  return mapAdminStore(row)
}

export async function updateStore(id: string, input: UpdateStoreInput): Promise<AdminStoreRow> {
  const existing = await prisma.store.findFirst({ where: { id, ...NOT_DELETED } })
  if (!existing) {
    throw new Error('Store not found')
  }

  if (input.slug) {
    const slug = slugify(input.slug)
    if (!slug) {
      throw new Error('A valid slug is required')
    }
    const conflict = await prisma.store.findFirst({
      where: { slug, ...NOT_DELETED, NOT: { id } },
    })
    if (conflict) {
      throw new Error('A store with this slug already exists')
    }
  }

  if (input.logoUrl !== undefined && input.logoUrl !== existing.logoUrl && existing.logoUrl) {
    await deleteCloudinaryImage(existing.logoUrl)
  }

  const row = await prisma.store.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      slug: input.slug ? slugify(input.slug) : undefined,
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      supportEmail: input.supportEmail === undefined ? undefined : input.supportEmail?.trim() || null,
      logoEmoji: input.logoEmoji?.trim(),
      logoUrl: input.logoUrl === undefined ? undefined : input.logoUrl?.trim() || null,
      currency: input.currency?.trim(),
      taxRate: input.taxRate,
      shippingFlat: input.shippingFlat,
      freeShippingThreshold: input.freeShippingThreshold,
      active: input.active,
      verified: input.verified,
    },
    include: {
      _count: {
        select: { products: { where: NOT_DELETED } },
      },
    },
  })

  return mapAdminStore(row)
}

export async function deleteStore(id: string): Promise<void> {
  await softDeleteStoreById(id)
}
