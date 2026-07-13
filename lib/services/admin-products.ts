import { accelerateArgs, ADMIN_LIST_CACHE, CATALOG_CACHE } from '@/lib/api/accelerate-cache'
import prisma from '@/lib/prisma'
import { deleteCloudinaryImages } from '@/lib/cloudinary'
import { mapDbProduct } from '@/lib/services/products'
import { requireStore } from '@/lib/services/stores'
import { NOT_DELETED, softDeleteProductById } from '@/lib/services/soft-delete'
import { diffRemovedImageUrls, normalizeProductImageUrls, primaryProductImageUrl } from '@/lib/utils/product-images'
import type { AdminProductRow, CreateProductInput, CreateProductVariantInput, ProductVariantType, UpdateProductInput } from '@/types/admin'
import type { Product } from '@/types/cart'

function resolveImageFields(input: { imageUrls?: string[] | null; imageUrl?: string | null }) {
  const imageUrls = normalizeProductImageUrls(input.imageUrls, input.imageUrl)
  return {
    imageUrls,
    imageUrl: primaryProductImageUrl(imageUrls),
  }
}

function mapAdminProductRow(row: {
  id: string
  slug: string
  name: string
  price: number
  stock: number
  rating: number
  emoji: string
  imageUrl: string | null
  imageUrls: string[]
  description: string
  published: boolean
  isDigital?: boolean
  digitalAssetUrl?: string | null
  variantType?: ProductVariantType
  store: { id: string; slug: string; name: string }
  category: { slug: string; name: string }
  _count: { variants: number }
  variants?: Array<CreateProductVariantInput & { stock: number }>
}): AdminProductRow {
  const imageUrls = normalizeProductImageUrls(row.imageUrls, row.imageUrl, {
    categorySlug: row.category.slug,
    productId: row.id,
  })
  const stock =
    row.variants && row.variants.length > 0
      ? row.variants.reduce((sum, variant) => sum + variant.stock, 0)
      : row.stock

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    stock,
    rating: row.rating,
    emoji: row.emoji,
    imageUrl: primaryProductImageUrl(imageUrls),
    imageUrls,
    description: row.description,
    published: row.published,
    isDigital: row.isDigital ?? false,
    digitalAssetUrl: row.digitalAssetUrl ?? null,
    variantType: row.variantType ?? 'COLOR',
    store: row.store,
    category: row.category,
    variantCount: row._count.variants,
    variants: row.variants,
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mapVariantRows(variants: CreateProductVariantInput[]) {
  const usedSlugs = new Set<string>()

  return variants.map((variant, index) => {
    const sku = variant.sku.trim()
    const color = variant.color.trim() || sku
    const baseSlug =
      variant.slug.trim() ||
      color
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      sku
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      `variant-${index + 1}`

    let slug = baseSlug
    let suffix = 2
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`
    }
    usedSlugs.add(slug)

    return {
      sku,
      slug,
      color,
      hex: variant.hex,
      stock: variant.stock,
      price: variant.price ?? null,
      emoji: variant.emoji ?? null,
      isDefault: variant.isDefault ?? index === 0,
    }
  })
}

export async function listAdminProducts(options?: {
  storeId?: string
  categorySlug?: string
  published?: boolean
  search?: string
  sort?: 'name' | 'price' | 'stock' | 'newest'
  page?: number
  pageSize?: number
}): Promise<{ data: AdminProductRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 20))
  const search = options?.search?.trim()

  const where = {
    ...NOT_DELETED,
    ...(options?.storeId ? { storeId: options.storeId } : {}),
    ...(options?.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    ...(options?.published != null ? { published: options.published } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const orderBy =
    options?.sort === 'price'
      ? { price: 'asc' as const }
      : options?.sort === 'stock'
        ? { stock: 'asc' as const }
        : options?.sort === 'newest' || !options?.sort
          ? { createdAt: 'desc' as const }
          : { name: 'asc' as const }

  const [total, rows] = await Promise.all([
    prisma.product.count(accelerateArgs({ where }, ADMIN_LIST_CACHE)),
    prisma.product.findMany(
      accelerateArgs(
        {
          where,
          include: {
            store: true,
            category: true,
            _count: { select: { variants: true } },
          },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        },
        ADMIN_LIST_CACHE,
      ),
    ),
  ])

  return {
    data: rows.map((row) =>
      mapAdminProductRow({
        id: row.id,
        slug: row.slug,
        name: row.name,
        price: row.price,
        stock: row.stock,
        rating: row.rating,
        emoji: row.emoji,
        imageUrl: row.imageUrl,
        imageUrls: row.imageUrls,
        description: row.description,
        published: row.published,
        isDigital: row.isDigital,
        digitalAssetUrl: row.digitalAssetUrl,
        store: {
          id: row.store.id,
          slug: row.store.slug,
          name: row.store.name,
        },
        category: {
          slug: row.category.slug,
          name: row.category.name,
        },
        _count: row._count,
      }),
    ),
    total,
    page,
    pageSize,
  }
}

export async function getAdminProduct(id: string): Promise<AdminProductRow | null> {
  const row = await prisma.product.findFirst(
    accelerateArgs(
      {
        where: { id, ...NOT_DELETED },
        include: {
          store: true,
          category: true,
          variants: { orderBy: { isDefault: 'desc' as const } },
          _count: { select: { variants: true } },
        },
      },
      ADMIN_LIST_CACHE,
    ),
  )

  if (!row) return null

  return mapAdminProductRow({
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    stock: row.stock,
    rating: row.rating,
    emoji: row.emoji,
    imageUrl: row.imageUrl,
    imageUrls: row.imageUrls,
    description: row.description,
    published: row.published,
    isDigital: row.isDigital,
    digitalAssetUrl: row.digitalAssetUrl,
    variantType: row.variantType,
    store: {
      id: row.store.id,
      slug: row.store.slug,
      name: row.store.name,
    },
    category: {
      slug: row.category.slug,
      name: row.category.name,
    },
    _count: row._count,
    variants: row.variants.map((variant) => ({
      sku: variant.sku,
      slug: variant.slug,
      color: variant.color,
      hex: variant.hex,
      stock: variant.stock,
      price: variant.price ?? undefined,
      emoji: variant.emoji ?? undefined,
      isDefault: variant.isDefault,
    })),
  })
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!input.storeId?.trim()) {
    throw new Error('storeId is required — every product must belong to a store')
  }

  const store = await requireStore(input.storeId)

  const category = await prisma.category.findFirst({
    where: { slug: input.categorySlug, ...NOT_DELETED },
  })
  if (!category) {
    throw new Error(`Category "${input.categorySlug}" not found`)
  }

  const slug = slugify(input.name)

  const existingSlug = await prisma.product.findFirst({
    where: {
      storeId: store.id,
      slug,
      ...NOT_DELETED,
    },
  })
  if (existingSlug) {
    throw new Error(`Product slug "${slug}" already exists in store "${store.name}"`)
  }

  const variants = input.variants ?? []
  const totalVariantStock = variants.reduce((sum, variant) => sum + variant.stock, 0)
  const stock = variants.length > 0 ? totalVariantStock : input.stock
  const variantRows = mapVariantRows(variants)
  const images = resolveImageFields(input)

  const row = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: category.id,
      slug,
      name: input.name.trim(),
      price: input.price,
      stock,
      rating: input.rating ?? 0,
      emoji: input.emoji,
      imageUrl: images.imageUrl,
      imageUrls: images.imageUrls,
      description: input.description.trim(),
      published: input.published ?? true,
      isDigital: input.isDigital ?? false,
      digitalAssetUrl: input.isDigital ? input.digitalAssetUrl?.trim() || null : null,
      variantType: input.variantType ?? 'COLOR',
      variants:
        variantRows.length > 0
          ? {
              create: variantRows,
            }
          : undefined,
    },
    include: {
      store: true,
      category: true,
      variants: { orderBy: { isDefault: 'desc' } },
      defaultVariant: true,
    },
  })

  const defaultVariant = row.variants.find((variant) => variant.isDefault) ?? row.variants[0]

  if (defaultVariant) {
    await prisma.product.update({
      where: { id: row.id },
      data: { defaultVariantId: defaultVariant.id },
    })
  }

  const created = await prisma.product.findUniqueOrThrow({
    where: { id: row.id },
    include: {
      store: true,
      category: true,
      variants: { orderBy: { isDefault: 'desc' } },
      defaultVariant: true,
    },
  })

  return mapDbProduct(created)
}

function resolveUpdatedStock(input: UpdateProductInput, fallback: number): number {
  if (input.variants !== undefined) {
    if (input.variants.length > 0) {
      return input.variants.reduce((sum, variant) => sum + variant.stock, 0)
    }
    return input.stock ?? fallback
  }
  return input.stock ?? fallback
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const existing = await prisma.product.findFirst({ where: { id, ...NOT_DELETED } })
  if (!existing) {
    throw new Error('Product not found')
  }

  let categoryId = existing.categoryId
  if (input.categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: input.categorySlug, ...NOT_DELETED },
    })
    if (!category) {
      throw new Error(`Category "${input.categorySlug}" not found`)
    }
    categoryId = category.id
  }

  const variants = input.variants
  const stock = resolveUpdatedStock(input, existing.stock)

  const previousImages = normalizeProductImageUrls(existing.imageUrls, existing.imageUrl)
  const nextImages =
    input.imageUrls !== undefined || input.imageUrl !== undefined
      ? resolveImageFields({
          imageUrls: input.imageUrls,
          imageUrl: input.imageUrl,
        })
      : null
  const removedImages = nextImages ? diffRemovedImageUrls(previousImages, nextImages.imageUrls) : []

  await prisma.$transaction(async (tx) => {
    if (variants !== undefined) {
      await tx.product.update({
        where: { id },
        data: { defaultVariantId: null },
      })
      await tx.productVariant.deleteMany({ where: { productId: id } })
    }

    await tx.product.update({
      where: { id },
      data: {
        categoryId,
        name: input.name?.trim() ?? existing.name,
        price: input.price ?? existing.price,
        stock,
        rating: input.rating ?? existing.rating,
        emoji: input.emoji ?? existing.emoji,
        ...(nextImages
          ? {
              imageUrl: nextImages.imageUrl,
              imageUrls: nextImages.imageUrls,
            }
          : {}),
        description: input.description?.trim() ?? existing.description,
        published: input.published ?? existing.published,
        isDigital: input.isDigital ?? existing.isDigital,
        digitalAssetUrl:
          input.isDigital !== undefined
            ? input.isDigital
              ? input.digitalAssetUrl?.trim() || null
              : null
            : input.digitalAssetUrl !== undefined
              ? input.digitalAssetUrl?.trim() || null
              : existing.digitalAssetUrl,
        variantType: input.variantType ?? existing.variantType,
        ...(variants !== undefined && variants.length > 0 ? { variants: { create: mapVariantRows(variants) } } : {}),
      },
    })

    if (variants !== undefined && variants.length > 0) {
      const createdVariants = await tx.productVariant.findMany({
        where: { productId: id },
        orderBy: { isDefault: 'desc' },
      })
      const defaultVariant = createdVariants.find((variant) => variant.isDefault) ?? createdVariants[0]
      if (defaultVariant) {
        await tx.product.update({
          where: { id },
          data: { defaultVariantId: defaultVariant.id },
        })
      }
    }
  })

  if (removedImages.length > 0) {
    await deleteCloudinaryImages(removedImages)
  }

  const updated = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      store: true,
      category: true,
      variants: { orderBy: { isDefault: 'desc' } },
      defaultVariant: true,
    },
  })

  return mapDbProduct(updated)
}

export async function setProductPublished(id: string, published: boolean): Promise<AdminProductRow> {
  const row = await prisma.product.update({
    where: { id },
    data: { published },
    include: {
      store: true,
      category: true,
      _count: { select: { variants: true } },
    },
  })

  return mapAdminProductRow({
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    stock: row.stock,
    rating: row.rating,
    emoji: row.emoji,
    imageUrl: row.imageUrl,
    imageUrls: row.imageUrls,
    description: row.description,
    published: row.published,
    isDigital: row.isDigital,
    digitalAssetUrl: row.digitalAssetUrl,
    store: {
      id: row.store.id,
      slug: row.store.slug,
      name: row.store.name,
    },
    category: {
      slug: row.category.slug,
      name: row.category.name,
    },
    _count: row._count,
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await softDeleteProductById(id)
}
