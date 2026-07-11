import type { Prisma } from '@/app/generated/prisma/client'
import type { CatalogSortBy, Product } from '@/types/cart'

/**
 * Strategy pattern — one algorithm per sort option.
 * Used by Redux selectors (client) and `ProductRepository` (server Prisma orderBy).
 */
export interface ProductSortStrategy {
  readonly id: CatalogSortBy
  readonly label: string
  sort(products: Product[]): Product[]
  toPrismaOrderBy(): Prisma.ProductOrderByWithRelationInput
}

abstract class BaseSortStrategy implements ProductSortStrategy {
  abstract readonly id: CatalogSortBy
  abstract readonly label: string
  abstract toPrismaOrderBy(): Prisma.ProductOrderByWithRelationInput

  sort(products: Product[]): Product[] {
    return this.sortCopy([...products])
  }

  protected abstract sortCopy(sorted: Product[]): Product[]
}

class NameAscStrategy extends BaseSortStrategy {
  readonly id = 'name-asc' as const
  readonly label = 'Relevance'

  toPrismaOrderBy() {
    return { name: 'asc' as const }
  }

  protected sortCopy(sorted: Product[]) {
    return sorted.sort((a, b) => a.name.localeCompare(b.name))
  }
}

class NameDescStrategy extends BaseSortStrategy {
  readonly id = 'name-desc' as const
  readonly label = 'Name: Z–A'

  toPrismaOrderBy() {
    return { name: 'desc' as const }
  }

  protected sortCopy(sorted: Product[]) {
    return sorted.sort((a, b) => b.name.localeCompare(a.name))
  }
}

class PriceAscStrategy extends BaseSortStrategy {
  readonly id = 'price-asc' as const
  readonly label = 'Price: Low to High'

  toPrismaOrderBy() {
    return { price: 'asc' as const }
  }

  protected sortCopy(sorted: Product[]) {
    return sorted.sort((a, b) => a.price - b.price)
  }
}

class PriceDescStrategy extends BaseSortStrategy {
  readonly id = 'price-desc' as const
  readonly label = 'Price: High to Low'

  toPrismaOrderBy() {
    return { price: 'desc' as const }
  }

  protected sortCopy(sorted: Product[]) {
    return sorted.sort((a, b) => b.price - a.price)
  }
}

class RatingDescStrategy extends BaseSortStrategy {
  readonly id = 'rating-desc' as const
  readonly label = 'Top Rated'

  toPrismaOrderBy() {
    return { rating: 'desc' as const }
  }

  protected sortCopy(sorted: Product[]) {
    return sorted.sort((a, b) => b.rating - a.rating)
  }
}

class NewestStrategy extends BaseSortStrategy {
  readonly id = 'newest' as const
  readonly label = 'Newest'

  toPrismaOrderBy() {
    return { createdAt: 'desc' as const }
  }

  /** Client list order is preserved — server already returns newest-first when requested. */
  protected sortCopy(sorted: Product[]) {
    return sorted
  }
}

/** Registry / facade — single lookup for sort strategies across client and server. */
export class SortStrategyRegistry {
  private static strategies: ProductSortStrategy[] = [
    new NameAscStrategy(),
    new NameDescStrategy(),
    new PriceAscStrategy(),
    new PriceDescStrategy(),
    new RatingDescStrategy(),
    new NewestStrategy(),
  ]

  static get(id: CatalogSortBy): ProductSortStrategy {
    return SortStrategyRegistry.strategies.find((s) => s.id === id) ?? new NameAscStrategy()
  }

  static all(): ProductSortStrategy[] {
    return SortStrategyRegistry.strategies
  }
}
