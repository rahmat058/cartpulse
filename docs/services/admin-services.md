# Admin Services

Modules: `admin-products.ts`, `admin-stores.ts`, `admin-categories.ts`, `admin-coupons.ts`, `admin-users.ts`, `activity-log.ts`

All admin mutation routes should call `logAdminActivity()` from `lib/admin-activity.ts` after successful writes.

---

## `admin-products.ts` — product CRUD

**Purpose:** Create, update, publish, and soft-delete products with variants (COLOR / SIZE), images, and stock sync.

### Key exports

| Function                             | Description                       |
| ------------------------------------ | --------------------------------- |
| `listAdminProducts`                  | Paginated admin table rows        |
| `getAdminProduct(id)`                | Edit form payload                 |
| `createProduct(input)`               | New product + variants            |
| `updateProduct(id, input)`           | Update with variant upsert/delete |
| `setProductPublished(id, published)` | Toggle visibility                 |
| `deleteProduct(id)`                  | Soft delete                       |

### Code demo — create product API

```typescript
// app/api/admin/products/route.ts
import { createProduct } from '@/lib/services/admin-products'
import { requireAdminAction } from '@/lib/admin-auth'
import { logAdminActivity } from '@/lib/admin-activity'

const access = requireAdminAction(session, 'create')
if ('error' in access) return access.error

const product = await createProduct(body)
await logAdminActivity({
  action: 'CREATE',
  entityType: 'PRODUCT',
  entityId: product.id,
  entityLabel: product.name,
  summary: `Created product "${product.name}"`,
})
return NextResponse.json({ data: product })
```

### Code demo — variant stock sync on update

```typescript
// lib/services/admin-products.ts (concept)
function resolveUpdatedStock(input, existingVariants) {
  if (input.variants?.length) {
    // Root stock = sum of variant stock; root field ignored
    return input.variants.reduce((sum, v) => sum + v.stock, 0)
  }
  return input.stock ?? 0
}

// variantType: 'COLOR' | 'SIZE'
// COLOR → sku, color name, hex swatch, stock
// SIZE  → sku, size name (stored in color field), stock, hex = ''
```

### Code demo — admin form payload

```typescript
// components/dashboard/ProductForm.tsx (concept)
const payload = {
  name: 'Running Shoes',
  variantType: 'SIZE',
  variants: [
    { sku: 'SHOE-S', color: 'S', stock: 10 },
    { sku: 'SHOE-M', color: 'M', stock: 15 },
  ],
}
await fetch(`/api/admin/products/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
})
```

---

## `admin-stores.ts` — store CRUD

**Purpose:** Manage marketplace stores with slug generation and soft-delete cascade.

### Key exports

| Function                 | Description           |
| ------------------------ | --------------------- |
| `getAdminStore(id)`      | Edit form             |
| `createStore(input)`     | New store             |
| `updateStore(id, input)` | Update profile        |
| `deleteStore(id)`        | Soft delete + cascade |

### Code demo

```typescript
// app/api/admin/stores/route.ts
import { createStore } from '@/lib/services/admin-stores'

const store = await createStore({
  name: 'Tech Haven',
  slug: 'tech-haven',
  description: 'Electronics specialist',
  verified: true,
})
```

---

## `admin-categories.ts` — category tree CRUD

**Purpose:** Hierarchical categories with depth limits and soft-delete cascade.

### Key exports

| Function                         | Description            |
| -------------------------------- | ---------------------- |
| `listAdminCategoryTree()`        | Admin tree with counts |
| `createAdminCategory(input)`     | New node               |
| `updateAdminCategory(id, input)` | Rename / reparent      |
| `deleteAdminCategory(id)`        | Soft delete children   |

### Code demo

```typescript
// app/api/admin/categories/route.ts
import { createAdminCategory } from '@/lib/services/admin-categories'

const category = await createAdminCategory({
  name: 'Smartphones',
  slug: 'smartphones',
  parentId: electronicsCategoryId,
})
```

---

## `admin-coupons.ts` — promo CRUD

**Purpose:** Admin management of discount codes.

### Key exports

| Function                       | Description               |
| ------------------------------ | ------------------------- |
| `listAdminCoupons()`           | Table rows                |
| `createAdminCoupon(input)`     | New coupon                |
| `updateAdminCoupon(id, input)` | Edit dates, value, limits |
| `deleteAdminCoupon(id)`        | Soft delete               |

### Code demo

```typescript
// app/api/admin/coupons/route.ts
import { createAdminCoupon } from '@/lib/services/admin-coupons'

const coupon = await createAdminCoupon({
  code: 'SAVE10',
  type: 'PERCENT',
  value: 10,
  minSubtotal: 50,
  maxUses: 100,
  active: true,
})
```

---

## `admin-users.ts` — role & permissions

**Purpose:** Update user roles and fine-grained CRUD permissions. Prevents demoting the last super admin.

### Key exports

| Function                | Description                                   |
| ----------------------- | --------------------------------------------- |
| `updateUserRole(input)` | Change role + `permCreate/Read/Update/Delete` |

### Code demo

```typescript
// app/api/admin/users/[id]/route.ts
import { updateUserRole } from '@/lib/services/admin-users'

await updateUserRole({
  userId: params.id,
  role: 'ADMIN',
  permissions: {
    permCreate: true,
    permRead: true,
    permUpdate: true,
    permDelete: false,
  },
})
```

> **Note:** `listUsers()` lives in `orders.ts` and is called from `GET /api/admin/users`.

---

## `activity-log.ts` — audit trail

**Purpose:** Record and list admin-panel actions for super-admin review.

### Key exports

| Function                   | Description                       |
| -------------------------- | --------------------------------- |
| `recordActivity(input)`    | Write log row (admin actors only) |
| `listActivityLogs(params)` | Paginated, searchable audit table |

### Code demo — log after mutation

```typescript
// lib/admin-activity.ts
import { recordActivity } from '@/lib/services/activity-log'

export async function logAdminActivity(input: RecordActivityInput) {
  const session = await auth()
  if (!session?.user?.id) return
  await recordActivity({ ...input, actorId: session.user.id })
}
```

### Code demo — activity API (super admin)

```typescript
// app/api/admin/activity/route.ts
import { listActivityLogs } from '@/lib/services/activity-log'

const logs = await listActivityLogs({
  page: 1,
  pageSize: 20,
  search: searchParams.get('q') ?? undefined,
  action: searchParams.get('action') ?? undefined,
})
return NextResponse.json(logs) // { data, total, page, pageSize }
```

UI debounces `q` via `useDebouncedValue` before calling this route.

---

## Admin upload

Image uploads use `/api/admin/upload` (Cloudinary) — not a separate service file:

```typescript
// Client — ProductForm.tsx
const formData = new FormData()
formData.append('file', file)
const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
const { url } = await res.json()
// url → saved in product.imageUrls
```
