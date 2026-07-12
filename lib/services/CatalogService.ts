import type { Prisma } from '@/app/generated/prisma/client'
import { NOT_DELETED } from '@/lib/core/constants'
import { BaseService } from '@/lib/core/BaseService'
import { getCategorySlugsIncludingDescendants } from '@/lib/services/categories'
import {
  mapDbProduct,
  mapStoreInfo,
  productRepository,
  type ProductRepository,
} from '@/lib/repositories/ProductRepository'
import type {
  CatalogQueryParams,
  CatalogSortBy,
  Product,
  ProductCategory,
  ProductsResponse,
  StoreInfo,
} from '@/types/cart'

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
    const rows = await this.products.findPublishedMany(where, query.sortBy)
    const data = rows.map(mapDbProduct)
    const store = rows[0]?.store ? mapStoreInfo(rows[0].store) : await this.products.getDefaultStore()
    const categories = [...new Set(data.map((product) => product.category))]

    return {
      meta: {
        schemaVersion: '2.0.0',
        collection: 'products',
        totalProducts: data.length,
        categories,
        currency: store.currency,
        generatedAt: new Date().toISOString(),
        store,
      },
      data,
    }
  }

  async getProductBySlug(slug: string, storeSlug?: string): Promise<Product | null> {
    const row = await this.products.findBySlug(slug, storeSlug)
    return row ? mapDbProduct(row) : null
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const rows = await this.products.findByIds(ids)
    return rows.map(mapDbProduct)
  }

  async getFeaturedProducts(limit = 6, storeSlug?: string): Promise<Product[]> {
    const rows = await this.products.findFeatured(limit, storeSlug)
    return rows.map(mapDbProduct)
  }
}

export const catalogService = new CatalogService()
