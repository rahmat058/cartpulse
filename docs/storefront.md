# Storefront

Public shopping experience for guests and signed-in customers. Layout: `StorefrontShell` (header, footer, cart drawer, category nav).

**Access:** Open to everyone. `/checkout` requires login (enforced by `proxy.ts`).

---

## Routes

| Route               | Page              | Key services / state                           |
| ------------------- | ----------------- | ---------------------------------------------- |
| `/`                 | Home              | `getFeaturedProducts`, `HomeShelfStrategy`     |
| `/products`         | Catalog           | `getProducts`, `listCategoryTree`              |
| `/products/[slug]`  | Product detail    | `getProductBySlug`, `listProductReviews`       |
| `/stores`           | Store directory   | `listStores`                                   |
| `/stores/[slug]`    | Store page        | `getStoreProfile`                              |
| `/cart`             | Cart page         | Redux `cartSlice`                              |
| `/checkout`         | Checkout          | `createOrderFromCart`, `StripeCheckoutService` |
| `/checkout/success` | Payment success   | `verifySessionAndFulfill`                      |
| `/checkout/cancel`  | Payment cancelled | `getOrderById`                                 |
| `/help`             | Help center + FAQ | Static content (en/bn)                         |
| `/about`            | About CartPulse   | Static content (en/bn)                         |
| `/contact`          | Contact info      | Static content (en/bn)                         |
| `/terms`            | Terms of service  | Static content (en/bn)                         |

Bengali locale: prefix with `/bn` (e.g. `/bn/products`).

---

## Catalog & discovery

### Filter flow

URL search params drive **server-side** Prisma queries — shareable and back-button friendly. Header + catalog search are **debounced** (`useDebouncedValue`, `SEARCH_DEBOUNCE_MS = 600`) before fetching suggestions / updating the URL. Matching uses **token/word-boundary** search (`lib/utils/product-search.ts`) so terms like `mobile` do not hit mid-word substrings in `automobiles`.

```typescript
// hooks/use-catalog-filters.ts → CatalogQueryParams
// ?search=phone&category=electronics&priceMin=100&sort=price-asc

// app/api/products/route.ts
const query = parseCatalogQueryParams(searchParams)
const products = await getProducts(query) // cursor page — never the full catalog
return apiJsonPublic(products) // CDN: s-maxage=60
```

Storefront product queries also apply Prisma Accelerate `cacheStrategy` via `accelerateArgs(..., CATALOG_CACHE)` in `ProductRepository`.

### Cursor pagination (Load more)

| Style      | Where                              | Params                                     |
| ---------- | ---------------------------------- | ------------------------------------------ |
| **Cursor** | `/products` Load more, suggestions | `cursor`, `pageSize` (default 24, max 100) |
| **Offset** | Admin / My Orders tables           | `page`, `pageSize`, `total`                |

```http
GET /api/products?sort=name-asc&pageSize=24
GET /api/products?sort=name-asc&pageSize=24&cursor=<lastProductId>
```

Response meta includes `nextCursor`, `hasMore`, `totalProducts`. The grid appends pages via `appendCatalogFromQuery` — no client-side slicing of a full dump.

Helpers: `lib/api/pagination.ts`, `hooks/use-debounced-value.ts`, `lib/utils/product-search.ts`, `ProductRepository.findPublishedAfterCursor`.

### Product card — quick add

```typescript
// components/catalog/ProductCard.tsx
import { useCart } from '@/hooks/use-cart'
import { getInStockVariants, getProductStock } from '@/types/cart'

const inStockVariants = getInStockVariants(product)
const stock = getProductStock(product)

function handleAddToCart() {
  dispatch(addItem({ productId: product.id, variantId: selectedVariantId, quantity: 1 }))
}
```

---

## Product detail — variants

Products support `variantType: COLOR | SIZE`.

```typescript
// components/page/ProductDetailView.tsx
import { getInStockVariants } from '@/types/cart'
import { ColorVariantPicker } from '@/components/catalog/ColorVariantPicker'

const availableVariants = getInStockVariants(product)  // OOS variants hidden

<ColorVariantPicker
  variants={availableVariants}
  variantType={product.variantType}  // swatches vs size buttons
  selectedId={selectedVariantId}
  onSelect={setSelectedVariantId}
/>
```

| `variantType` | UI                     | Card label |
| ------------- | ---------------------- | ---------- |
| `COLOR`       | Color swatches + hex   | "3 colors" |
| `SIZE`        | Text buttons (S, M, L) | "4 sizes"  |

### Digital products

Products with `isDigital: true` show a **Digital** badge on cards and PDP. They are always in stock, use **instant download** delivery copy, and skip inventory decrement at checkout.

```typescript
// lib/utils/digital-products.ts
import { isDigitalProduct, cartHasDigitalProduct, cartIsAllDigital } from '@/lib/utils/digital-products'

// types/cart.ts — getProductStock returns 9999 for digital products
```

After payment, digital items appear in the customer's **Library** (`/dashboard/library`). See [user-dashboard.md](./user-dashboard.md#digital-library).

---

## Cart (Redux)

Cart state is normalized by `productId + variantId` and persisted to `localStorage`.

```typescript
// hooks/use-cart.ts
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { addItem, updateQuantity, removeItem } from '@/lib/store/slices/cartSlice'

const items = useAppSelector(selectCartItems)
const itemCount = useAppSelector(selectCartItemCount)

dispatch(addItem({ productId, variantId, quantity: 1 }))
```

```typescript
// lib/utils/cartPersistence.ts — auto-save
localStorage.setItem('cartpulse-cart-v1', JSON.stringify(itemsById))
```

### Pricing (derived, never stored in DB)

```typescript
// lib/utils/cartPricing.ts
const pricing = calculateCartPricing({
  itemsById,
  productsById,
  promoCode,
  coupon,
  taxRate: 0.08,
  shippingFlat: 5.99,
  freeShippingThreshold: 75,
})
// → { subtotal, discount, tax, shipping, total }
```

---

## Cart state

Redux cart (`lib/store/slices/cartSlice.ts`) stores **only**:

- `productId`
- `variantId` (optional)
- `quantity`

No prices are persisted client-side. Display totals use `calculateCartPricing()` in `lib/utils/cartPricing.ts` with `resolveLineUnitPrice()` for variant-aware line totals.

---

## Checkout security

Client sends `itemsById` + `promoCode` + address — **never** `total`, `subtotal`, or `unitPrice`.

Server flow (`lib/validations/cart.ts` + `lib/services/orders.ts`):

1. `checkoutBodySchema` — Zod validation on POST body
2. `sanitizeCartItemsById()` — integers 1–999, strip unknown fields
3. `getProductsByIds()` — authoritative prices from PostgreSQL
4. `calculateCartPricing()` — subtotal, tax, shipping, discount, total
5. Stock check + order create

```typescript
// lib/validations/cart.ts
export const checkoutBodySchema = z.object({
  itemsById: z.record(z.string(), cartLineSchema),
  promoCode: z.string().trim().nullable().optional(),
  paymentMethod: z.enum(['COD', 'STRIPE']).optional(),
  shippingAddress: shippingAddressSchema,
})
```

---

## Checkout

### Step flow

1. Review cart (server re-prices from DB)
2. Shipping address
3. Payment method: **COD** (physical only) or **Card / Stripe**
4. Place order

**Digital cart rules:**

| Rule      | Behavior                                                    |
| --------- | ----------------------------------------------------------- |
| COD       | Hidden and rejected server-side when cart has digital items |
| Shipping  | `$0` when all items are digital                             |
| Messaging | Checkout shows instant library delivery note                |

```typescript
// components/page/CheckoutPageClient.tsx
const hasDigital = cartHasDigitalProduct(lines, productsById)
const allDigital = cartIsAllDigital(lines, productsById)
// COD button hidden when hasDigital; auto-switch to STRIPE
```

```typescript
// components/page/CheckoutPage.tsx (concept)
const res = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemsById,
    promoCode,
    paymentMethod: 'STRIPE',
    shippingAddress,
  }),
})

const { url, orderId } = await res.json()
if (url)
  window.location.assign(url) // Stripe redirect
else router.push(`/checkout/success?orderId=${orderId}`)
```

### Stock at checkout

```typescript
// COD  → stock decremented immediately in createOrderFromCart
// Stripe → stock checked at creation, decremented in markOrderPaid
```

See [services/commerce.md](./services/commerce.md) for full flow.

---

## i18n

Storefront supports English (default) and Bengali via `next-intl`.

```typescript
// i18n/routing.ts
export const routing = defineRouting({
  locales: ['en', 'bn'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /products (en), /bn/products (bn)
})
```

Use `@/i18n/navigation` for locale-aware `Link` and `useRouter`.

---

## Related docs

- [services/catalog.md](./services/catalog.md) — product/category/store services
- [services/commerce.md](./services/commerce.md) — orders, inventory, Stripe
- [user-dashboard.md](./user-dashboard.md) — post-purchase account area
