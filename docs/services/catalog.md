# Catalog Services

Modules: `products.ts`, `CatalogService.ts`, `categories.ts`, `stores.ts`, `products-client.ts`

---

## `products.ts` — catalog facade

**Purpose:** Stable import path for all storefront and checkout product reads. Delegates to `catalogService`.

### Key exports

| Function                                | Description                                                         |
| --------------------------------------- | ------------------------------------------------------------------- |
| `getProducts(query)`                    | **Cursor**-paginated catalog (`cursor`, `pageSize`, filters, sort)  |
| `getProductBySlug(slug)`                | Single product for PDP (strips `digitalAssetUrl` from public DTO)   |
| `getProductsByIds(ids)`                 | Batch load for cart/checkout pricing (lean list DTO)                |
| `getFeaturedProducts(limit)`            | Home shelves / featured                                             |
| `parseCatalogQueryParams(searchParams)` | Parse URL filters → query (`cursor`, `pageSize` / `limit`, …)       |

### Code demo — API route (cursor + CDN)

```typescript
// app/api/products/route.ts
import { getProducts, parseCatalogQueryParams } from '@/lib/services/products'
import { apiJsonPublic } from '@/lib/api/security-headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('ids')) {
    // batch by id — cart / wishlist
  }
  const query = parseCatalogQueryParams(searchParams)
  const products = await getProducts(query)
  return apiJsonPublic(products) // Cache-Control: s-maxage=60, stale-while-revalidate=300
}
```

```http
GET /api/products?pageSize=24
GET /api/products?pageSize=24&cursor=<productId>
# meta: { nextCursor, hasMore, totalProducts, pageSize }
```

### Code demo — server page (PDP)

```typescript
// app/[locale]/(storefront)/products/[slug]/page.tsx
import { getProductBySlug } from '@/lib/services/products'
import { notFound } from 'next/navigation'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()
  return <ProductDetailView product={product} />
}
```

### Code demo — checkout re-pricing

```typescript
// lib/services/orders.ts (inside createOrderFromCart)
const productIds = [...new Set(cartLines.map((line) => line.productId))]
const products = await getProductsByIds(productIds)
const productsById = Object.fromEntries(products.map((p) => [p.id, p]))
// Server never trusts client-side prices — recalculates from DB
```

---

## `CatalogService.ts` — catalog business rules

**Purpose:** OOP service behind `products.ts`. Handles filter parsing, category scoping, sort strategies, and repository calls.

### Class methods

| Method                    | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `parseCatalogQueryParams` | `search`, `category`, prices, `sort`, `cursor`, `pageSize` / `limit`         |
| `getProducts`             | Cursor page via `findPublishedAfterCursor`; lean list DTO; `nextCursor` meta |
| `getProductBySlug`        | Slug lookup with store + category + variants                                 |
| `getProductsByIds`        | Batch by ID for cart validation                                              |

### Code demo — internal flow

```typescript
// Simplified — actual code in lib/services/CatalogService.ts
class CatalogService extends BaseService {
  async getProducts(query: CatalogQuery) {
    const categorySlugs = query.category ? await getCategorySlugsIncludingDescendants(query.category) : undefined

    return productRepository.findMany({
      ...query,
      categorySlugs,
      published: true,
      notDeleted: NOT_DELETED,
    })
  }
}
```

---

## `categories.ts` — category tree

**Purpose:** Load category hierarchy for nav, filters, and catalog scoping.

### Key exports

| Function                                     | Description                           |
| -------------------------------------------- | ------------------------------------- |
| `listCategoryTree()`                         | Nested tree with product counts       |
| `getCategorySlugsIncludingDescendants(slug)` | All slugs under a parent (for filter) |

### Code demo — API

```typescript
// app/api/categories/route.ts
import { listCategoryTree } from '@/lib/services/categories'

export async function GET() {
  const tree = await listCategoryTree()
  return NextResponse.json({ data: tree })
}
```

### Code demo — catalog filter hook

```typescript
// hooks/use-categories.ts
const res = await fetch('/api/categories')
const { data } = await res.json()
// data → CategoryTreeNode[] used by CategoryFilter + mega menu
```

---

## `stores.ts` — multi-store catalog

**Purpose:** Store profiles, listings, and default pricing settings (tax, shipping, free-shipping threshold).

### Key exports

| Function                      | Description                           |
| ----------------------------- | ------------------------------------- |
| `listStores()`                | Published stores for `/stores`        |
| `getStoreProfile(slug)`       | Store page with stats                 |
| `getDefaultPricingSettings()` | Tax rate + shipping used at checkout  |
| `requireStore(storeId)`       | Admin guard — throws if store missing |

### Code demo — checkout pricing defaults

```typescript
// lib/services/orders.ts
const defaults = await getDefaultPricingSettings()
const pricing = calculateCartPricing({
  itemsById,
  productsById,
  taxRate: defaults.taxRate,
  shippingFlat: defaults.shippingFlat,
  freeShippingThreshold: defaults.freeShippingThreshold,
})
```

### Code demo — store page

```typescript
// app/[locale]/(storefront)/stores/[slug]/page.tsx
import { getStoreProfile } from '@/lib/services/stores'

const store = await getStoreProfile(slug)
```

---

## `products-client.ts` — browser fetch

**Purpose:** Client-side wrappers for `/api/products`. Used by Redux cart and React Query hooks.

### Code demo — hook

```typescript
// hooks/use-products.ts
import { fetchProducts } from '@/lib/services/products-client'

export function useProducts(query: CatalogQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => fetchProducts(query),
  })
}
```

### Code demo — cart slice hydration

```typescript
// lib/store/slices/cartSlice.ts
import { fetchProducts } from '@/lib/services/products-client'

// Re-fetch product details when validating cart lines client-side
const products = await fetchProducts({ ids: productIds.join(',') })
```

---

## Related types

Stock and variant helpers live in `types/cart.ts`:

```typescript
import { getInStockVariants, resolveProductStock } from '@/types/cart'

const available = getInStockVariants(product) // hides OOS variants on PDP
const totalStock = resolveProductStock(product) // sum of variant stock or root stock
```
