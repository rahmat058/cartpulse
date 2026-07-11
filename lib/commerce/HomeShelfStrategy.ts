import type { Product } from '@/types/cart'
import { getProducts, getFeaturedProducts } from '@/lib/services/products'
import { listStores } from '@/lib/services/stores'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { mapDbProduct } from '@/lib/services/products'

export type HomeShelfKind =
  | 'recently-ordered'
  | 'all-products'
  | 'featured-stores'
  | 'best-sellers'
  | 'new-arrivals'
  | 'recently-viewed'

export interface HomeShelfMeta {
  kind: HomeShelfKind
  title: string
  subtitle?: string
  titleClassName?: string
  href?: string
}

export interface ProductShelfPayload extends HomeShelfMeta {
  type: 'products'
  products: Product[]
}

export interface StoreShelfPayload extends HomeShelfMeta {
  type: 'stores'
  stores: Array<{
    id?: string
    slug: string
    name: string
    logoEmoji?: string
    logoUrl?: string
    verified?: boolean
    productCount?: number
  }>
}

export type HomeShelfPayload = ProductShelfPayload | StoreShelfPayload

/** Strategy interface for homepage shelves (Strategy pattern). */
export interface HomeShelfStrategy {
  readonly meta: HomeShelfMeta
  load(): Promise<HomeShelfPayload>
}

abstract class ProductShelfStrategy implements HomeShelfStrategy {
  abstract readonly meta: HomeShelfMeta
  abstract loadProducts(): Promise<Product[]>

  async load(): Promise<ProductShelfPayload> {
    const products = await this.loadProducts()
    return { ...this.meta, type: 'products', products }
  }
}

class RecentlyOrderedStrategy extends ProductShelfStrategy {
  readonly meta: HomeShelfMeta = {
    kind: 'recently-ordered',
    title: 'Recently ordered',
    subtitle: "Products you've recently ordered from our store",
    titleClassName: 'text-teal-600',
    href: '/dashboard/orders',
  }

  async loadProducts(): Promise<Product[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const items = await prisma.orderItem.findMany({
      where: { order: { userId: session.user.id, status: { not: 'CANCELLED' } } },
      include: {
        product: {
          include: {
            store: true,
            category: true,
            variants: { orderBy: { isDefault: 'desc' as const } },
            defaultVariant: true,
          },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 24,
    })

    const seen = new Set<string>()
    const products: Product[] = []
    for (const item of items) {
      if (seen.has(item.productId) || !item.product.published) continue
      seen.add(item.productId)
      products.push(mapDbProduct(item.product))
      if (products.length >= 10) break
    }
    return products
  }
}

class AllProductsStrategy extends ProductShelfStrategy {
  readonly meta: HomeShelfMeta = {
    kind: 'all-products',
    title: 'All products',
    subtitle: 'Find all products from our store and more',
    href: '/products',
  }

  async loadProducts(): Promise<Product[]> {
    const catalog = await getProducts({ sortBy: 'name-asc' })
    return catalog.data.slice(0, 20)
  }
}

class BestSellersStrategy extends ProductShelfStrategy {
  readonly meta: HomeShelfMeta = {
    kind: 'best-sellers',
    title: 'Best sellers this week',
    subtitle: 'Find all products from our store and more',
    href: '/products?sortBy=rating-desc',
  }

  async loadProducts(): Promise<Product[]> {
    return getFeaturedProducts(10)
  }
}

class NewArrivalsStrategy extends ProductShelfStrategy {
  readonly meta: HomeShelfMeta = {
    kind: 'new-arrivals',
    title: 'New arrivals',
    subtitle: 'Find all products from our store and more',
    href: '/products?sortBy=newest',
  }

  async loadProducts(): Promise<Product[]> {
    const catalog = await getProducts({ sortBy: 'newest' })
    return catalog.data.slice(0, 10)
  }
}

/** Client-persisted recently viewed is hydrated separately; server returns popular fallback. */
class RecentlyViewedStrategy extends ProductShelfStrategy {
  readonly meta: HomeShelfMeta = {
    kind: 'recently-viewed',
    title: 'Recently viewed',
    subtitle: 'Pick up where you left off',
    href: '/products',
  }

  async loadProducts(): Promise<Product[]> {
    const catalog = await getProducts({ sortBy: 'rating-desc' })
    return catalog.data.slice(0, 8)
  }
}

class FeaturedStoresStrategy implements HomeShelfStrategy {
  readonly meta: HomeShelfMeta = {
    kind: 'featured-stores',
    title: 'Featured stores · Verified sellers',
    subtitle: 'Find all stores from our store and more',
    href: '/stores',
  }

  async load(): Promise<StoreShelfPayload> {
    const stores = await listStores(true)
    const featured = stores
      .filter((store) => store.verified || (store.productCount ?? 0) > 0)
      .sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)))
    return {
      ...this.meta,
      type: 'stores',
      stores: featured.map((store) => ({
        id: store.id,
        slug: store.slug,
        name: store.name,
        logoEmoji: store.logoEmoji,
        logoUrl: store.logoUrl,
        verified: store.verified,
        productCount: store.productCount,
      })),
    }
  }
}

/** Facade / registry that composes homepage shelves in display order. */
export class HomePageComposer {
  private readonly strategies: HomeShelfStrategy[]

  constructor(strategies?: HomeShelfStrategy[]) {
    this.strategies =
      strategies ??
      [
        new RecentlyOrderedStrategy(),
        new AllProductsStrategy(),
        new FeaturedStoresStrategy(),
        new BestSellersStrategy(),
        new NewArrivalsStrategy(),
        new RecentlyViewedStrategy(),
      ]
  }

  async compose(): Promise<HomeShelfPayload[]> {
    const shelves = await Promise.all(this.strategies.map((strategy) => strategy.load()))
    return shelves.filter((shelf) => {
      if (shelf.type === 'stores') return shelf.stores.length > 0
      if (shelf.kind === 'recently-ordered') return shelf.products.length > 0
      return shelf.products.length > 0
    })
  }
}
