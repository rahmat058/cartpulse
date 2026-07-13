# Super Admin

Extended capabilities beyond regular `ADMIN`. Same `/admin` layout, but four routes are restricted to `SUPER_ADMIN` only.

**Demo account:** `superadmin@platform.com` / `password123`

---

## Super-admin-only routes

Defined in `lib/auth-access.ts`:

```typescript
export const SUPER_ADMIN_ONLY_PATHS = [
  '/admin/users',
  '/admin/analytics',
  '/admin/activity',
  '/admin/settings',
] as const
```

| Route              | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `/admin/users`     | User list, role changes, CRUD permissions      |
| `/admin/analytics` | Revenue charts, orders over time, top products |
| `/admin/activity`  | Audit log of all admin actions                 |
| `/admin/settings`  | Platform-wide settings                         |

### Route protection

```typescript
// proxy.ts
if (!canAccessAdminPath(role, withoutLocale)) {
  return NextResponse.redirect('/admin') // ADMIN hitting /admin/users → bounced
}

// lib/auth-access.ts
export function canAccessAdminPath(role, pathname) {
  if (!canAccessAdmin(role)) return false
  if (isSuperAdmin(role)) return true
  if (isSuperAdminOnlyPath(pathname)) return false
  return true
}
```

---

## Users management

### List users (offset pagination)

```typescript
// app/api/admin/users/route.ts
import { listUsers } from '@/lib/services/orders' // note: lives in orders.ts
import { parsePageSearchParams } from '@/lib/api/pagination'

const { page, pageSize, search } = parsePageSearchParams(searchParams)
const users = await listUsers({ search, role, page, pageSize })
// { data, total, page, pageSize }
```

Admin UI debounces search (`SEARCH_DEBOUNCE_MS = 600`) before refetch — same pattern as orders/stores/coupons.

### Update role & permissions

```typescript
// components/admin/UserRoleDialog.tsx
import { updateUserRole } from '@/lib/services/admin-users'

await updateUserRole({
  userId: user.id,
  role: 'ADMIN',
  permissions: {
    permCreate: true,
    permRead: true,
    permUpdate: true,
    permDelete: false,
  },
})
```

Safeguards:

- Cannot demote the last `SUPER_ADMIN`
- Cannot soft-delete yourself

### Soft delete user

```typescript
// app/api/admin/users/[id]/route.ts
import { softDeleteUserById } from '@/lib/services/soft-delete'

await softDeleteUserById(userId)
await logAdminActivity({ action: 'DELETE', entityType: 'USER', ... })
```

---

## Analytics

```typescript
// app/api/admin/analytics/route.ts
import { getAnalytics } from '@/lib/services/orders'

const data = await getAnalytics({ from, to })
// → { revenueByDay, ordersByDay, topProducts }
```

```typescript
// components/dashboard/AdminAnalyticsPage.tsx
import { RevenueChart } from '@/components/dashboard/RevenueChart'

<RevenueChart data={analytics.revenueByDay} />
// Recharts — theme-aware (dark/light)
```

---

## Activity log

Full audit trail of admin-panel actions.

```typescript
// app/api/admin/activity/route.ts
import { listActivityLogs } from '@/lib/services/activity-log'

const result = await listActivityLogs({
  page: 1,
  pageSize: 20,
  search: 'product',
  action: 'DELETE',
  entityType: 'PRODUCT',
})
```

```typescript
// components/dashboard/AdminActivityPage.tsx
<AdminDataTable
  columns={activityColumns}
  data={result.rows}
  searchPlaceholder="Search summary, actor, entity…"
/>
```

Only actions by `ADMIN` / `SUPER_ADMIN` actors are recorded — customer actions are excluded.

### What gets logged

| Entity   | Actions logged                         |
| -------- | -------------------------------------- |
| Product  | CREATE, UPDATE, DELETE, publish toggle |
| Order    | Status changes                         |
| Store    | CREATE, UPDATE, DELETE                 |
| Category | CREATE, UPDATE, DELETE                 |
| Coupon   | CREATE, UPDATE, DELETE                 |
| User     | Role change, DELETE                    |

---

## Settings

Platform configuration (tax, shipping, store name, support email).

```typescript
// app/[locale]/(admin)/admin/settings/page.tsx
// Backed by Store / platform config in database
// Used by getDefaultPricingSettings() at checkout
```

---

## SUPER_ADMIN vs ADMIN comparison

| Capability                    | ADMIN                 | SUPER_ADMIN |
| ----------------------------- | --------------------- | ----------- |
| Products CRUD                 | Yes (per permissions) | Yes (all)   |
| Orders management             | Yes                   | Yes         |
| Categories / stores / coupons | Yes                   | Yes         |
| User management               | No                    | Yes         |
| Analytics charts              | No                    | Yes         |
| Activity audit log            | No                    | Yes         |
| Platform settings             | No                    | Yes         |
| Delete entities               | Only if `permDelete`  | Always      |
| Customer dashboard            | Yes                   | Yes         |

---

## Related docs

- [admin.md](./admin.md) — shared admin panel features
- [services/admin-services.md](./services/admin-services.md) — `admin-users`, `activity-log`
- [services/commerce.md](./services/commerce.md) — `getAnalytics`, `listUsers`
