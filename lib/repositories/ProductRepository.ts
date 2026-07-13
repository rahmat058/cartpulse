import type { Prisma } from '@/app/generated/prisma/client'
import { BaseRepository } from '@/lib/core/BaseRepository'
import { SortStrategyRegistry } from '@/lib/commerce/SortStrategy'
import { normalizeProductImageUrls, primaryProductImageUrl } from '@/lib/utils/product-images'
import {
  resolveProductStock,
  type CatalogSortBy,
  type Product,
  type ProductCategory,
  type ProductVariantType,
  type StoreInfo,
} from '@/types/cart'

/** Prisma payload shape for catalog product queries. */
export type DbProduct = Prisma.ProductGetPayload<{
  include: {
    store: true
    category: true
    variants: true
    defaultVariant: true
  }
}>

/** Standard include graph for published catalog products. */
export const productInclude = {
  store: true,
  category: true,
  variants: { orderBy: { isDefault: 'desc' as const } },
  defaultVariant: true,
} satisfies Prisma.ProductInclude

/**
 * Repository pattern — product persistence and row mapping.
 * All Prisma `where` / `include` / `orderBy` for catalog products live here.
 */
export class ProductRepository extends BaseRepository {
  /** Map a Prisma product row to the storefront `Product` DTO. */
  mapDbProduct(row: DbProduct): Product {
    const variants =
      row.variants.length > 0
        ? row.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            slug: variant.slug,
            color: variant.color,
            hex: variant.hex,
            stock: variant.stock,
            price: variant.price ?? undefined,
            emoji: variant.emoji ?? undefined,
            isDefault: variant.isDefault,
          }))
        : undefined

    const product: Product = {
      id: row.id,
      slug: row.slug,
      storeId: row.storeId,
      storeSlug: row.store.slug,
      name: row.name,
      category: row.category.slug as Product['category'],
      price: row.price,
      stock: row.stock,
      rating: row.rating,
      emoji: row.emoji,
      imageUrl: primaryProductImageUrl(normalizeProductImageUrls(row.imageUrls, row.imageUrl)) ?? undefined,
      imageUrls: normalizeProductImageUrls(row.imageUrls, row.imageUrl),
      description: row.description,
      published: row.published,
      isDigital: row.isDigital,
      digitalAssetUrl: row.digitalAssetUrl,
      variantType: (row.variantType ?? 'COLOR') as ProductVariantType,
      defaultVariantId: row.defaultVariantId ?? undefined,
      variants,
    }

    return {
      ...product,
      stock: variants?.length ? resolveProductStock(product) : product.stock,
    }
  }

  mapStoreInfo(row: DbProduct['store']): StoreInfo {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      supportEmail: row.supportEmail ?? undefined,
      logoEmoji: row.logoEmoji ?? undefined,
      logoUrl: row.logoUrl ?? undefined,
      currency: row.currency,
      taxRate: row.taxRate,
      shippingFlat: row.shippingFlat,
      freeShippingThreshold: row.freeShippingThreshold,
      verified: row.verified,
    }
  }

  /** Strategy pattern — delegates DB sort to `SortStrategyRegistry`. */
  getOrderBy(sortBy: CatalogSortBy = 'name-asc'): Prisma.ProductOrderByWithRelationInput {
    return SortStrategyRegistry.get(sortBy).toPrismaOrderBy()
  }

  /** Stable order for cursor pagination — primary sort + id tiebreaker. */
  getCursorOrderBy(sortBy: CatalogSortBy = 'name-asc'): Prisma.ProductOrderByWithRelationInput[] {
    return [this.getOrderBy(sortBy), { id: 'asc' }]
  }

  async findPublishedMany(where: Prisma.ProductWhereInput, sortBy: CatalogSortBy = 'name-asc'): Promise<DbProduct[]> {
    return this.db.product.findMany({
      where,
      include: productInclude,
      orderBy: this.getOrderBy(sortBy),
    })
  }

  async findPublishedPage(
    where: Prisma.ProductWhereInput,
    sortBy: CatalogSortBy = 'name-asc',
    options: { skip: number; take: number },
  ): Promise<DbProduct[]> {
    return this.db.product.findMany({
      where,
      include: productInclude,
      orderBy: this.getOrderBy(sortBy),
      skip: options.skip,
      take: options.take,
    })
  }

  /**
   * Cursor pagination — `cursor` is the last product id from the previous page.
   * Fetches `take + 1` rows so the caller can detect `hasMore`.
   */
  async findPublishedAfterCursor(
    where: Prisma.ProductWhereInput,
    sortBy: CatalogSortBy = 'name-asc',
    options: { cursor?: string; take: number },
  ): Promise<DbProduct[]> {
    const take = Math.max(1, options.take)
    return this.db.product.findMany({
      where,
      include: productInclude,
      orderBy: this.getCursorOrderBy(sortBy),
      ...(options.cursor
        ? {
            cursor: { id: options.cursor },
            skip: 1,
          }
        : {}),
      take: take + 1,
    })
  }

  async countPublished(where: Prisma.ProductWhereInput): Promise<number> {
    return this.db.product.count({ where })
  }

  /** List DTO — omits download URL and trims long descriptions for catalog payloads. */
  mapListProduct(row: DbProduct): Product {
    const product = this.mapDbProduct(row)
    const description = product.description.length > 180 ? `${product.description.slice(0, 177)}…` : product.description
    return {
      ...product,
      description,
      digitalAssetUrl: undefined,
    }
  }

  async findBySlug(slug: string, storeSlug?: string): Promise<DbProduct | null> {
    return this.db.product.findFirst({
      where: {
        slug,
        published: true,
        ...this.activeOnly,
        store: { ...this.activeOnly, ...(storeSlug ? { slug: storeSlug } : {}) },
        category: this.activeOnly,
      },
      include: productInclude,
    })
  }

  async findByIds(ids: string[]): Promise<DbProduct[]> {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (uniqueIds.length === 0) return []

    return this.db.product.findMany({
      where: {
        id: { in: uniqueIds },
        published: true,
        ...this.activeOnly,
        store: this.activeOnly,
        category: this.activeOnly,
      },
      include: productInclude,
    })
  }

  async findFeatured(limit = 6, storeSlug?: string): Promise<DbProduct[]> {
    return this.db.product.findMany({
      where: {
        published: true,
        ...this.activeOnly,
        store: { ...this.activeOnly, ...(storeSlug ? { slug: storeSlug } : {}) },
        category: this.activeOnly,
      },
      include: productInclude,
      orderBy: { rating: 'desc' },
      take: limit,
    })
  }

  async getDefaultStore(): Promise<StoreInfo> {
    const store = await this.db.store.findFirst({
      where: this.activeOnly,
      orderBy: { createdAt: 'asc' },
    })
    if (!store) {
      throw new Error('No store found. Run npm run db:seed first.')
    }
    return this.mapStoreInfo(store as DbProduct['store'])
  }
}

/** Singleton repository — inject a mock in tests by constructing `CatalogService` directly. */
export const productRepository = new ProductRepository()

/** Backward-compatible functional export used by shelf strategies and checkout. */
export function mapDbProduct(row: DbProduct): Product {
  return productRepository.mapDbProduct(row)
}

export function mapListProduct(row: DbProduct): Product {
  return productRepository.mapListProduct(row)
}

export function mapStoreInfo(row: DbProduct['store']): StoreInfo {
  return productRepository.mapStoreInfo(row)
}

export type { ProductCategory }
