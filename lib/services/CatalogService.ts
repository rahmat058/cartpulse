import type { Prisma } from '@/app/generated/prisma/client'
import { NOT_DELETED } from '@/lib/core/constants'
import { BaseService } from '@/lib/core/BaseService'
import { getCategorySlugsIncludingDescendants } from '@/lib/services/categories'
import {
  mapListProduct,
  mapDbProduct,
  mapStoreInfo,
  productRepository,
  type ProductRepository,
} from '@/lib/repositories/ProductRepository'
import type { CatalogQueryParams, CatalogSortBy, Product, ProductCategory, ProductsResponse } from '@/types/cart'
import { CATALOG_DEFAULT_PAGE_SIZE, CATALOG_MAX_PAGE_SIZE } from '@/types/cart'

function clampPageSize(value: number | undefined, fallback = CATALOG_DEFAULT_PAGE_SIZE): number {
  if (!value || !Number.isFinite(value)) return fallback
  return Math.min(CATALOG_MAX_PAGE_SIZE, Math.max(1, Math.floor(value)))
}

/**
 * Service layer — catalog business rules (filters, meta, query parsing).
 * Delegates persistence to `ProductRepository` (repository pattern).
 */
export class CatalogService extends BaseService {
  constructor(private readonly products: ProductRepository = productRepository) {
    super()
  }

  /** Parse URL search params into a typed catalog query (storefront + API). */
  parseCatalogQueryParams(
    searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  ): CatalogQueryParams & { storeSlug?: string } {
    const get = (key: string): string | undefined => {
      if (searchParams instanceof URLSearchParams) {
        return searchParams.get(key) ?? undefined
      }
      const value = searchParams[key]
      return Array.isArray(value) ? value[0] : value
    }

    const category = get('category') as ProductCategory | undefined
    const sortBy = get('sort') as CatalogSortBy | undefined
    const priceMin = get('priceMin')
    const priceMax = get('priceMax')
    const minRating = get('minRating')
    const pageSize = get('pageSize') ?? get('limit')
    const cursor = get('cursor')?.trim() || undefined

    return {
      category: category && category !== 'all' ? category : undefined,
      sortBy,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      inStockOnly: get('inStock') === 'true',
      freeDeliveryOnly: get('freeDelivery') === 'true',
      search: get('search')?.trim() || undefined,
      storeSlug: get('store') ?? undefined,
      cursor,
      pageSize: pageSize ? Number(pageSize) : undefined,
    }
  }

  private async buildWhere(query: CatalogQueryParams & { storeSlug?: string }): Promise<Prisma.ProductWhereInput> {
    const priceFilter: { gte?: number; lte?: number } = {}
    if (query.priceMin !== undefined) priceFilter.gte = query.priceMin
    if (query.priceMax !== undefined) priceFilter.lte = query.priceMax
    if (query.freeDeliveryOnly) {
      priceFilter.gte = Math.max(priceFilter.gte ?? 0, 50)
    }

    const categorySlugs = query.category ? await getCategorySlugsIncludingDescendants(query.category) : null

    return {
      published: true,
      ...NOT_DELETED,
      store: {
        ...NOT_DELETED,
        ...(query.storeSlug ? { slug: query.storeSlug } : {}),
      },
      category: categorySlugs
        ? {
            ...NOT_DELETED,
            slug: categorySlugs.length === 1 ? categorySlugs[0] : { in: categorySlugs },
          }
        : NOT_DELETED,
      ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
      ...(query.minRating !== undefined ? { rating: { gte: query.minRating } } : {}),
      ...(query.inStockOnly
        ? {
            OR: [{ stock: { gt: 0 } }, { variants: { some: { stock: { gt: 0 } } } }],
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }
  }

  async getProducts(query: CatalogQueryParams & { storeSlug?: string } = {}): Promise<ProductsResponse> {
    const where = await this.buildWhere(query)
    const pageSize = clampPageSize(query.pageSize)
    const cursor = query.cursor?.trim() || undefined

    const [totalProducts, rows, defaultStore] = await Promise.all([
      this.products.countPublished(where),
      this.products.findPublishedAfterCursor(where, query.sortBy, { cursor, take: pageSize }),
      this.products.getDefaultStore(),
    ])

    const hasMore = rows.length > pageSize
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows
    const data = pageRows.map(mapListProduct)
    const store = pageRows[0]?.store ? mapStoreInfo(pageRows[0].store) : defaultStore
    const categories = [...new Set(data.map((product) => product.category))]
    const nextCursor = hasMore ? (pageRows[pageRows.length - 1]?.id ?? null) : null

    return {
      meta: {
        schemaVersion: '2.0.0',
        collection: 'products',
        totalProducts,
        categories,
        currency: store.currency,
        generatedAt: new Date().toISOString(),
        store,
        pageSize,
        nextCursor,
        hasMore,
      },
      data,
    }
  }

  async getProductBySlug(slug: string, storeSlug?: string): Promise<Product | null> {
    const row = await this.products.findBySlug(slug, storeSlug)
    if (!row) return null
    // Never expose raw download URLs on the public PDP — library API handles downloads.
    const product = mapDbProduct(row)
    return { ...product, digitalAssetUrl: undefined }
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const rows = await this.products.findByIds(ids)
    return rows.map(mapListProduct)
  }

  async getFeaturedProducts(limit = 6, storeSlug?: string): Promise<Product[]> {
    const rows = await this.products.findFeatured(limit, storeSlug)
    return rows.map(mapListProduct)
  }
}

export const catalogService = new CatalogService()
