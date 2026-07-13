# User Services

Modules: `wishlist.ts`, `reviews.ts`, `notifications.ts`, `library.ts`

Used by the customer dashboard and storefront product pages.

**Accelerate:** library / wishlist / review **reads** use short `USER_DATA_CACHE` / `REVIEW_CACHE`. Mutations and notification inbox queries are not cached.

---

## `library.ts` — digital product library

**Purpose:** Grant and list permanent download access for purchased digital products.

### Key exports

| Function                      | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `listUserLibrary`             | Library cards for `/dashboard/library`             |
| `grantLibraryAccessForOrder`  | Upsert `LibraryItem` rows when order is `PAID`   |
| `userOwnsLibraryProduct`      | Ownership check                                  |
| `getLibraryDownloadTarget`    | Resolve `digitalAssetUrl` for authorized user    |

### Grant trigger

```typescript
// lib/services/orders.ts
await grantLibraryAccessForOrder(orderId)
// markOrderPaid() — after Stripe/COD payment confirmed
// updateOrderStatus() — when admin sets status to PAID
```

### Code demo — download API

```typescript
// app/api/library/[productId]/route.ts
const target = await getLibraryDownloadTarget(user.id, productId)
if (!target?.url) return NextResponse.json({ error: '...' }, { status: 404 })
return NextResponse.redirect(target.url)
```

### Schema

`LibraryItem`: `userId`, `productId` (unique together), optional `orderId`, `createdAt`. Product fields: `isDigital`, `digitalAssetUrl`.

---

## `notifications.ts` — order update inbox

**Purpose:** Create and list in-app notifications when order status changes.

### Key exports

| Function                        | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `notifyOrderStatusChange`       | Create notification when status actually changes |
| `createOrderStatusNotification` | Insert `ORDER_UPDATE` row for user               |
| `listUserNotifications`         | Inbox list for `/dashboard/notifications`        |
| `getUnreadNotificationCount`    | Sidebar badge count                              |
| `markNotificationRead`          | Single notification                              |
| `markAllNotificationsRead`      | Clear all unread                                 |

### Notifiable statuses

`PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED` — triggered from `updateOrderStatus()` (admin) and `markOrderPaid()` (payment).

### Code demo — API

```typescript
// GET /api/notifications
const [data, unreadCount] = await Promise.all([listUserNotifications(userId), getUnreadNotificationCount(userId)])
return NextResponse.json({ data, unreadCount })
```

---

## `wishlist.ts` — saved products

**Purpose:** CRUD for user wishlist items. Only published products are returned.

### Key exports

| Function                                | Description                                 |
| --------------------------------------- | ------------------------------------------- |
| `listWishlist(userId)`                  | Full product DTOs for `/dashboard/wishlist` |
| `listWishlistProductIds(userId)`        | ID list for heart-icon state                |
| `addWishlistItem(userId, productId)`    | Upsert wishlist row                         |
| `removeWishlistItem(userId, productId)` | Delete row                                  |
| `toggleWishlistItem(userId, productId)` | Add or remove                               |

### Code demo — API route

```typescript
// app/api/wishlist/route.ts
import { listWishlist, addWishlistItem, removeWishlistItem } from '@/lib/services/wishlist'

export async function GET() {
  const user = await requireSessionUser()
  const items = await listWishlist(user.id)
  return NextResponse.json({ data: items })
}

export async function POST(request: Request) {
  const user = await requireSessionUser()
  const { productId } = await request.json()
  await addWishlistItem(user.id, productId)
  return NextResponse.json({ ok: true })
}
```

### Code demo — client hook

```typescript
// hooks/use-wishlist.ts
async function toggle(productId: string) {
  await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, action: 'toggle' }),
  })
  queryClient.invalidateQueries({ queryKey: ['wishlist'] })
}
```

---

## `reviews.ts` — product reviews

**Purpose:** List reviews on PDP, let users submit reviews, and show review history in dashboard.

### Key exports

| Function                             | Description                                     |
| ------------------------------------ | ----------------------------------------------- |
| `listProductReviews(productId)`      | Public reviews for PDP tab                      |
| `createProductReview(userId, input)` | Submit review; updates product `rating` average |
| `listUserReviews(userId)`            | User's review history for `/dashboard/reviews`  |

### Code demo — PDP server load

```typescript
// app/[locale]/(storefront)/products/[slug]/page.tsx
import { listProductReviews } from '@/lib/services/reviews'

const reviews = await listProductReviews(product.id)
return <ProductDetailView product={product} reviews={reviews} />
```

### Code demo — submit review API

```typescript
// app/api/reviews/route.ts
import { createProductReview } from '@/lib/services/reviews'

export async function POST(request: Request) {
  const user = await requireSessionUser()
  const body = await request.json()

  const review = await createProductReview(user.id, {
    productId: body.productId,
    rating: body.rating,
    title: body.title,
    body: body.body,
  })

  return NextResponse.json({ data: review })
}
```

### Code demo — create with rating sync

```typescript
// lib/services/reviews.ts (simplified)
export async function createProductReview(userId, input) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({ data: { userId, ...input } })

    const agg = await tx.review.aggregate({
      where: { productId: input.productId },
      _avg: { rating: true },
    })
    await tx.product.update({
      where: { id: input.productId },
      data: { rating: agg._avg.rating ?? 0 },
    })

    return review
  })
}
```
