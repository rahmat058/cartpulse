# User Dashboard (My Account)

Signed-in customer area. Layout: `AccountShell` with sidebar navigation.

**Access:** `USER`, `ADMIN`, and `SUPER_ADMIN` — `canAccessDashboard()` in `lib/auth-access.ts`.  
**URL prefix:** `/dashboard/*`

---

## Dual dashboard (admin & super admin)

Admins have **two separate areas** — not one or the other:

| Area            | URL            | Purpose                                                    |
| --------------- | -------------- | ---------------------------------------------------------- |
| **My Account**  | `/dashboard/*` | Personal orders, wishlist, library, profile, notifications |
| **Admin panel** | `/admin/*`     | Store management (products, orders, users, …)              |

### How to switch

| From               | Action                                                     |
| ------------------ | ---------------------------------------------------------- |
| Storefront header  | User icon → `/dashboard`                                   |
| My Account sidebar | **Admin panel** link (visible for `ADMIN` / `SUPER_ADMIN`) |
| Admin panel header | **My Account** button (shows profile photo when uploaded)  |

Login respects `callbackUrl` — signing in with `?callbackUrl=/dashboard/orders` goes to My Account even for admins.

---

## Routes

| Route                      | Purpose                                | Data source                                   |
| -------------------------- | -------------------------------------- | --------------------------------------------- |
| `/dashboard`               | Redirects to orders                    | —                                             |
| `/dashboard/orders`        | Order history table + export           | `listUserOrders`                              |
| `/dashboard/orders/[id]`   | Order detail + PDF                     | `getOrderById`                                |
| `/dashboard/profile`       | Photo, name, password (provider-aware) | `PATCH /api/user/profile`, avatar APIs        |
| `/dashboard/addresses`     | Saved addresses                        | `localStorage` (`cartpulse:addresses:*`)      |
| `/dashboard/wishlist`      | Saved products                         | `listWishlist`                                |
| `/dashboard/reviews`       | User review history                    | `listUserReviews`                             |
| `/dashboard/library`       | Digital library — purchased downloads  | `listUserLibrary` (`lib/services/library.ts`) |
| `/dashboard/notifications` | Order update inbox                     | `listUserNotifications`                       |
| `/dashboard/settings`      | Sign-in method + account security      | Session `user.authProvider`                   |

---

## Notifications inbox

When an admin changes order status (or payment is confirmed), the order owner gets an in-app notification.

| Status change | Example inbox title |
| ------------- | ------------------- |
| `PAID`        | Payment confirmed   |
| `SHIPPED`     | Order shipped       |
| `DELIVERED`   | Order delivered     |
| `CANCELLED`   | Order cancelled     |

### Service

```typescript
// lib/services/notifications.ts
await notifyOrderStatusChange(userId, orderId, previousStatus, newStatus)
// Called from updateOrderStatus() and markOrderPaid()
```

### APIs

| Method | Route                     | Description                   |
| ------ | ------------------------- | ----------------------------- |
| GET    | `/api/notifications`      | List + `unreadCount`          |
| PATCH  | `/api/notifications`      | Mark all as read              |
| PATCH  | `/api/notifications/[id]` | Mark one read; links to order |

### UI

- `NotificationsPanel` — list, unread dots, click-through to order detail
- `hooks/use-notifications.ts` — sidebar unread badge
- `AccountSidebar` — badge count on Notifications nav item

**Requires** `yarn db:push` for the `notifications` table. Status changes before migration are not backfilled.

---

## Digital library

Permanent access to **digital** products the user has paid for (eBooks, PDFs, templates). Physical orders are tracked under **Orders** — the library is download-only.

### How access is granted

```typescript
// lib/services/library.ts
await grantLibraryAccessForOrder(orderId)
// Called from markOrderPaid() and updateOrderStatus() when status → PAID
```

Only order lines where `product.isDigital === true` create `LibraryItem` rows (`@@unique([userId, productId])`).

### Download API

```typescript
// GET /api/library/[productId]
// 1. requireSessionUser()
// 2. getLibraryDownloadTarget(userId, productId) — ownership check
// 3. NextResponse.redirect(digitalAssetUrl)
```

### UI

- `AccountLibraryPanel` — responsive card grid with **Download** button
- `formatDateDisplay()` for stable SSR dates (avoids locale hydration mismatch)
- Empty state links to `/products`

### Demo data

After `yarn db:seed`, sign in as `customer@demo.com` — 2 digital items from a seeded paid order (Developer Handbook, Brand Style Guide, etc.).

---

## Sign-in method awareness

The session stores the **active sign-in provider** as `user.authProvider` (`credentials` | `google` | `github`). UI adapts based on how the user signed in for this session — not all linked methods.

| Page                  | Credentials session                             | OAuth session (Google/GitHub)                    |
| --------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `/dashboard/settings` | Badge + link to edit profile/password           | Badge only; profile managed by provider          |
| `/dashboard/profile`  | Full edit: avatar upload, name, change password | Read-only OAuth photo; optional **Set password** |

Components: `AuthMethodBadges`, `SettingsSignOutButton`, `PasswordBanner` (OAuth users without a password).

---

## Profile photo & avatars

| Sign-in method      | Avatar source                         | Profile UI                                 |
| ------------------- | ------------------------------------- | ------------------------------------------ |
| **Credentials**     | Cloudinary (`cartpulse/avatars/`)     | Upload, change, remove                     |
| **Google / GitHub** | Provider profile image → `User.image` | Read-only; refreshed on each OAuth sign-in |

Allowed upload formats (credentials only): JPG, JPEG, PNG, WebP, SVG — validated by `isAllowedAvatarImage()` in `lib/cloudinary.ts`.

```typescript
// POST /api/user/avatar — credentials sessions only
const formData = new FormData()
formData.append('file', file)
await fetch('/api/user/avatar', { method: 'POST', body: formData })
await update({ image: newUrl }) // refresh session

// DELETE /api/user/avatar
await fetch('/api/user/avatar', { method: 'DELETE' })
```

Components: `ProfileAvatarSection`, `UserAvatar` (also used in admin header **My Account** button).

---

## OAuth password banner

When signed in with Google/GitHub and the account has **no password** yet, `PasswordBanner` appears on My Account pages. It suggests adding email + password as a second sign-in method. Dismissible via **Not now** (`localStorage`). Links to `/dashboard/profile` → **Set a password**.

OAuth-only users can still set a password on the profile page — this links credentials to the same `User` row without creating a duplicate account.

---

## Orders table

Upgraded to admin-style data table with search, status filter, pagination, and CSV/XLSX export.

```typescript
// components/dashboard/UserOrdersTable.tsx
import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { TableExportMenu } from '@/components/admin/TableExportMenu'
import { mapUserOrderRowsForExport } from '@/lib/export/admin-table-rows'
```

### Server page load

```typescript
// app/[locale]/(user)/dashboard/orders/page.tsx
import { listUserOrders } from '@/lib/services/orders'

const orders = await listUserOrders(user.id)
return <UserOrdersTable orders={orders} />
```

---

## Order detail & PDF

```typescript
// Download PDF
<a href={`/api/orders/${order.id}/pdf`} download>
  Download invoice
</a>
```

---

## Wishlist

Synced via `/api/wishlist` when signed in. Client toggle from `ProductCard` / `ProductDetailView`.

---

## Profile update

```typescript
// PATCH /api/user/profile
await fetch('/api/user/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Jane Doe', currentPassword, newPassword }),
})
```

---

## Addresses (client-side)

Addresses are stored in browser `localStorage`, not the database. Used to pre-fill checkout shipping form.

---

## Sidebar navigation

```typescript
// components/account/AccountSidebar.tsx
// Nav: Orders, Wishlist, Reviews, Addresses, Profile, Notifications, Settings, Library
// Admin roles also see: Admin panel → /admin
```

---

## What USER cannot do

| Action                          | Blocked by                                      |
| ------------------------------- | ----------------------------------------------- |
| Access `/admin/*`               | `proxy.ts` → redirect to login                  |
| View other users' orders        | `getOrderById` owner check                      |
| Change order status             | Admin API only                                  |
| Manage products / users         | Admin panel                                     |
| Upload avatar via OAuth session | `POST /api/user/avatar` rejects non-credentials |

---

## Related docs

- [services/user-services.md](./services/user-services.md) — wishlist, reviews, notifications, library
- [services/auth-services.md](./services/auth-services.md) — OAuth, linking, avatar APIs
- [services/commerce.md](./services/commerce.md) — orders, checkout validation
- [admin.md](./admin.md) — back-office (separate area)
