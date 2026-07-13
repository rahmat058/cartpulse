# Admin Panel

Back-office for store operators. Layout: `AdminLayout` with sidebar, data tables, and export menus.

**Access:** `ADMIN` and `SUPER_ADMIN` — `canAccessAdmin()` in `lib/auth-access.ts`.  
**URL prefix:** `/admin/*`

Admins also have a **personal My Account** at `/dashboard/*` — see [user-dashboard.md](./user-dashboard.md#dual-dashboard-admin--super-admin).

---

## Header shortcuts

| Button              | Destination  | Notes                                     |
| ------------------- | ------------ | ----------------------------------------- |
| **My Account**      | `/dashboard` | Shows `UserAvatar` when profile image set |
| **View storefront** | `/`          | Same height as My Account button          |

My Account sidebar (when on `/dashboard`) links back via **Admin panel** → `/admin`.

---

## Routes

| Route                  | Purpose                      | Permission   |
| ---------------------- | ---------------------------- | ------------ |
| `/admin`               | KPI overview + recent orders | All admins   |
| `/admin/products`      | Product table + export       | `permRead`   |
| `/admin/products/new`  | Create product               | `permCreate` |
| `/admin/products/[id]` | Edit product + variants      | `permUpdate` |
| `/admin/orders`        | Order table + export         | All admins   |
| `/admin/orders/[id]`   | Status updates, PDF          | All admins   |
| `/admin/categories`    | Category tree CRUD           | All admins   |
| `/admin/stores`        | Store management             | All admins   |
| `/admin/coupons`       | Coupon CRUD                  | All admins   |

Super-admin-only routes are in [superadmin.md](./superadmin.md).

---

## Permission model

`ADMIN` users have four boolean flags on the `User` model:

| Flag         | Controls                  |
| ------------ | ------------------------- |
| `permCreate` | POST create routes        |
| `permRead`   | GET list/detail routes    |
| `permUpdate` | PATCH update routes       |
| `permDelete` | DELETE soft-delete routes |

`SUPER_ADMIN` bypasses all permission checks.

### Code demo — API guard

```typescript
// app/api/admin/products/[id]/route.ts
import { auth } from '@/lib/auth'
import { requireAdminAction } from '@/lib/admin-auth'

export async function PATCH(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'update')
  if ('error' in access) return access.error

  const product = await updateProduct(id, body)
  await logAdminActivity({ action: 'UPDATE', entityType: 'PRODUCT', ... })
  return NextResponse.json({ data: product })
}
```

### Default ADMIN permissions (seeded)

```typescript
// types/auth.ts
permCreate: true,
permRead: true,
permUpdate: true,
permDelete: false,  // delete disabled by default
```

---

## Products

### List + export (offset pagination)

Admin product table loads **one server page** at a time. Search is debounced (`SEARCH_DEBOUNCE_MS = 600`) before refetch. List queries use Accelerate `ADMIN_LIST_CACHE`.

```typescript
// components/dashboard/AdminProductsPage.tsx
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'

const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
// GET /api/admin/products?page=1&pageSize=10&search=...
const { data, total } = await listAdminProducts({ search: debouncedSearch, page, pageSize })
```

Same offset pattern: **Orders**, **Stores**, **Coupons**, **Users**, **Activity** (`page` / `pageSize` / `total`). Storefront catalog uses **cursor** pagination instead — see [storefront.md](./storefront.md).

### Create / edit with variants

```typescript
// components/dashboard/ProductForm.tsx
const form = useForm<ProductFormValues>({
  resolver: zodResolver(productSchema),
  defaultValues: {
    variantType: 'COLOR',
    variants: [{ sku: '', color: '', hex: '#000000', stock: 0 }],
  },
})

// With variants → root stock disabled, shows computed total
const variantStockTotal = variants.reduce((s, v) => s + v.stock, 0)
```

| `variantType` | Form fields per row                |
| ------------- | ---------------------------------- |
| `COLOR`       | SKU, color name, hex swatch, stock |
| `SIZE`        | SKU, size name, stock (no swatch)  |

### Digital products

Toggle **Digital product** in the form — requires a **Download URL** (`digitalAssetUrl`). Stock and variant sections are hidden; inventory is not tracked.

```typescript
// lib/validations/product.ts — when isDigital: true
digitalAssetUrl: z.string().trim().refine(/* valid URL */)

// lib/services/admin-products.ts
isDigital: input.isDigital ?? false,
digitalAssetUrl: input.isDigital ? input.digitalAssetUrl?.trim() : null,
```

Paid orders containing digital lines grant library access automatically — no manual step.

### Image upload

```typescript
// Requires CLOUDINARY_URL in .env
const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
const { url } = await res.json()
setValue('imageUrls', [...imageUrls, url])
```

---

## Orders

### List (offset pagination)

Admin orders table fetches **one page** from the API (`listAllOrdersPage`). Search is debounced before refetch — same helpers as products (`parsePageSearchParams`, `useDebouncedValue`).

```typescript
// GET /api/orders?page=1&pageSize=10&search=...&status=PAID
```

### Status workflow

```
PENDING → PAID → SHIPPED → DELIVERED
              ↘ CANCELLED
```

Each status change (except no-op) notifies the **order owner** via `notifyOrderStatusChange()` → `/dashboard/notifications`. Setting status to **PAID** also grants digital library access via `grantLibraryAccessForOrder()`.

```typescript
// app/api/orders/[id]/route.ts
import { updateOrderStatus } from '@/lib/services/orders'

await updateOrderStatus(orderId, 'SHIPPED')
// → creates Notification row for order.userId
await logAdminActivity({
  action: 'STATUS_CHANGE',
  entityType: 'ORDER',
  entityId: orderId,
  summary: 'Marked order as SHIPPED',
})
```

### Export

```typescript
// components/dashboard/AdminOrdersPage.tsx
<TableExportMenu filename="orders" rows={mapOrderRowsForExport(orders)} />
```

---

## Categories, stores, coupons

List endpoints use **offset** pagination (`page` / `pageSize` / `total`) with debounced search. UI pattern:

```typescript
// hooks/use-admin-resource.ts + useDebouncedValue
const { data, loading, error, refetch } = useAdminResource<AdminCouponRow>({
  endpoint: '/api/admin/coupons',
})
```

Drawer-based create/edit via `createEntityDrawerProvider` factory in `lib/react/`.

---

## Activity logging

Every admin mutation logs to the audit trail (visible to super admin at `/admin/activity`):

```typescript
// lib/admin-activity.ts
await logAdminActivity({
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: 'PRODUCT' | 'ORDER' | 'STORE' | 'CATEGORY' | 'COUPON' | 'USER',
  entityId: '...',
  entityLabel: 'Product name',
  summary: 'Human-readable description',
  metadata: { optional: 'extra context' },
})
```

---

## Dashboard KPIs

```typescript
// app/[locale]/(admin)/admin/page.tsx
import { getAdminKpis } from '@/lib/services/orders'

const kpis = await getAdminKpis()
// → { revenue, orderCount, userCount, lowStockCount }
```

---

## What ADMIN cannot do

| Action                                   | Reason                                |
| ---------------------------------------- | ------------------------------------- |
| `/admin/users`                           | Super-admin only                      |
| `/admin/analytics`                       | Super-admin only                      |
| `/admin/activity`                        | Super-admin only                      |
| `/admin/settings`                        | Super-admin only                      |
| Delete entities (if `permDelete: false`) | `requireAdminAction('delete')` blocks |

Attempting a super-admin route redirects to `/admin`.

---

## Related docs

- [superadmin.md](./superadmin.md) — users, analytics, activity, settings
- [services/admin-services.md](./services/admin-services.md) — all admin service modules
- [services/commerce.md](./services/commerce.md) — orders, inventory
