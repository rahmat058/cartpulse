# CartPulse — Architecture

Next.js 16 marketplace with **Prisma 7 + PostgreSQL + Accelerate**, bilingual storefront (`en` / `bn`), Redux cart/wishlist, NextAuth v5, COD + Stripe checkout, customer **My Account**, and an **Admin** panel.

There is **no mock catalog API** — products, variants, and orders live in PostgreSQL.

Detailed service docs, role guides, and the feature checklist: **[docs/](./docs/)**.

---

## High-level map

```
                    ┌─────────────────────────────────────────┐
                    │              proxy.ts                  │
                    │  API guards · i18n · auth/role gates   │
                    └─────────────────────────────────────────┘
                                          │
        ┌─────────────┬───────────┬───────┴───────┬─────────────┐
        ▼             ▼           ▼               ▼             ▼
   Storefront      Auth      User dashboard    Admin        /api/*
   (public shop)  (sign-in)  (My Account)    (back-office)  (REST)
```

| Area       | Route group         | Layout shell      | Who can access               |
| ---------- | ------------------- | ----------------- | ---------------------------- |
| Storefront | `(storefront)/`     | `StorefrontShell` | Everyone                     |
| Auth       | `(auth)/`           | `AuthShell`       | Guests (+ redirects)         |
| User       | `(user)/dashboard/` | `AccountShell`    | Signed-in customers + admins |
| Admin      | `(admin)/admin/`    | `AdminLayout`     | `ADMIN`, `SUPER_ADMIN`       |

All page routes are under `app/[locale]/…` with **next-intl** (`en` default, `bn` prefixed). URLs like `/products` and `/bn/products` serve the same pages in different locales.

---

## Project structure

```
cartpulse/
├── app/
│   ├── [locale]/
│   │   ├── (storefront)/     # Public shop
│   │   ├── (auth)/           # Login, register, password reset
│   │   ├── (user)/dashboard/ # My Account
│   │   └── (admin)/admin/    # Admin panel
│   ├── api/                  # REST handlers
│   ├── generated/prisma/     # Prisma Client output
│   └── layout.tsx
├── components/
│   ├── account/              # Account sidebar, address/wishlist panels
│   ├── admin/                # Data tables, export, drawers
│   ├── auth/                 # Auth forms
│   ├── cart/                 # Cart drawer + line items
│   ├── catalog/              # ProductCard, filters, variant picker
│   ├── checkout/             # Checkout stepper
│   ├── dashboard/            # User + admin page panels
│   ├── layout/               # Header, Footer, shells
│   ├── page/                 # Page-level clients (Home, PDP, checkout)
│   ├── providers/            # Auth, Redux, Query, theme
│   ├── storefront/           # Home shelves, hero, FAQ
│   └── ui/                   # Design system primitives
├── hooks/                    # use-cart, use-wishlist, admin hooks
├── i18n/                     # next-intl routing + navigation helpers
├── lib/
│   ├── api/                  # Rate limits, origin checks, guards, Accelerate cache presets
│   ├── commerce/             # Home shelves, sort/pricing strategies
│   ├── export/               # Admin + user table CSV/XLSX export
│   ├── repositories/         # Prisma data access
│   ├── services/             # Business logic (orders, inventory, catalog, …)
│   ├── store/                # Redux cart + wishlist
│   ├── validations/          # Zod schemas
│   └── auth*.ts              # NextAuth config + access helpers
├── prisma/schema.prisma
├── proxy.ts                  # Next.js 16 edge proxy (auth, i18n, API guards)
├── docs/                     # Service docs, role guides, feature checklist
└── types/
```

---

## Storefront

Public shopping experience wrapped in `StorefrontShell` (header, footer, cart drawer, category nav).

### Routes

| Route               | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `/`                 | Home — hero, category tiles, strategy-driven product shelves |
| `/products`         | Catalog — search, filters, sort, **cursor** Load more        |
| `/products/[slug]`  | Product detail — variants, reviews, related products         |
| `/stores`           | Store directory                                              |
| `/stores/[slug]`    | Single-store listing                                         |
| `/cart`             | Full cart page                                               |
| `/checkout`         | Multi-step checkout (**login required**)                     |
| `/checkout/success` | Post-payment confirmation                                    |
| `/checkout/cancel`  | Stripe cancel / declined redirect                            |
| `/help`             | Help center + FAQ                                            |
| `/about`            | About CartPulse                                              |
| `/contact`          | Contact info & hours                                         |
| `/terms`            | Terms & conditions                                           |

Locale prefix: `/bn/products`, `/bn/checkout`, etc.

### Data & state

- **Catalog / PDP** — `GET /api/products` (cursor-paginated), `/api/products/[slug]`, `/api/categories`, `/api/stores`
- **Cart** — Redux (`lib/store/`) persisted to `localStorage` (`cartpulse-cart-v1`); stores `productId`, `variantId`, `quantity` only — **no prices**
- **Wishlist** — synced via `/api/wishlist` when signed in
- **Pricing at checkout** — server re-fetches product prices from DB, validates cart lines with Zod (`lib/validations/cart.ts`), and recalculates totals via `resolveLineUnitPrice()` (variant-aware); client totals are display-only
- **Search debounce** — `useDebouncedValue` (`SEARCH_DEBOUNCE_MS = 600`) on header/catalog search and admin table search; clears stale suggestions while typing
- **Product search** — token/word-boundary matching (`lib/utils/product-search.ts`) so `mobile` does not match `automobiles` in descriptions

### Catalog pagination (cursor)

Storefront **Load more** uses Prisma cursor pagination (no schema change). Default `pageSize` is `24` (`CATALOG_DEFAULT_PAGE_SIZE`, max `100`).

| Param / field        | Role                                                       |
| -------------------- | ---------------------------------------------------------- |
| `pageSize` / `limit` | Page size                                                  |
| `cursor`             | Last product `id` from previous page                       |
| `meta.nextCursor`    | Opaque cursor for the next request (product id), or `null` |
| `meta.hasMore`       | Whether another page exists                                |
| `meta.totalProducts` | Filtered total count (for result chrome)                   |

```http
GET /api/products?sort=name-asc&pageSize=24
GET /api/products?sort=name-asc&pageSize=24&cursor=<lastProductId>
```

Repository: `ProductRepository.findPublishedAfterCursor` — `orderBy: [sort, { id: 'asc' }]`, `cursor: { id }`, `skip: 1`, `take: pageSize + 1`.

Home shelves request a **first page only** (`pageSize: 8–20`) — they do not load the full catalog.

### Caching & ISR (Vercel)

| Surface                 | Behavior                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| Home `/`                | `export const revalidate = 60` (ISR). No `force-dynamic`.                |
| Public catalog GETs     | `apiJsonPublic` + proxy `nextPublicApiResponse` → `s-maxage=60`, SWR 300 |
| **Prisma Accelerate**   | Runtime via `DATABASE_ACCELERATE_URL`; `cacheStrategy` on hot reads      |
| Auth-gated pages        | NextAuth only on `/admin`, `/dashboard`, `/checkout` (not public shop)   |
| Private / mutating APIs | `Cache-Control: no-store`                                                |

Helpers: `lib/api/cache-headers.ts`, `lib/api/security-headers.ts`, `lib/api/pagination.ts`, `lib/api/accelerate-cache.ts`.

### Prisma Accelerate

| Concern          | Implementation                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Env              | `DATABASE_URL` = direct `postgres://…` (CLI / migrate); `DATABASE_ACCELERATE_URL` = `prisma+postgres://…` (app) |
| Client           | `lib/prisma.ts` — `accelerateUrl` + `withAccelerate()` (no `PrismaPg` adapter at runtime)                       |
| CLI              | `prisma.config.ts` → `env('DATABASE_URL')`                                                                      |
| Query cache      | `accelerateArgs(args, PRESET)` adds `cacheStrategy: { ttl, swr }` without breaking Prisma `include` types       |
| Presets          | `CATALOG_CACHE`, `ORDER_CACHE`, `REVIEW_CACHE`, `COUPON_CACHE`, `USER_DATA_CACHE`, `ADMIN_LIST_CACHE`, …        |
| Do **not** cache | Auth, verification tokens, notifications, and all writes                                                        |

```typescript
// lib/repositories/ProductRepository.ts (storefront)
await this.db.product.findMany(accelerateArgs({ where, include: productInclude, orderBy }, CATALOG_CACHE))
```

### Products, variants & stock

| Concept       | Behavior                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------ |
| `variantType` | `COLOR` (swatches + hex) or `SIZE` (text buttons)                                          |
| Root `stock`  | Editable only when the product has **no** variants                                         |
| With variants | Root stock is derived as the **sum of variant stock**                                      |
| Storefront    | Out-of-stock variants hidden (`getInStockVariants`); sold-out uses `resolveProductStock()` |
| Cards         | Show “X colors” or “X sizes” based on `variantType`                                        |

Key helpers: `types/cart.ts` — `getInStockVariants`, `resolveProductStock`, `getProductStock`.

### Checkout & inventory

`POST /api/checkout` creates orders via `lib/services/orders.ts`:

1. Validates body with `checkoutBodySchema` (`lib/validations/cart.ts`)
2. Sanitizes cart lines — only `productId`, `variantId`, `quantity` (integers 1–999); drops client-sent prices
3. Loads authoritative prices from DB via `getProductsByIds`
4. Recalculates subtotal, tax, shipping, discount with `calculateCartPricing()` + `resolveLineUnitPrice()`
5. `assertSufficientStockForOrderLines` (`lib/services/inventory.ts`) — **skipped for digital lines**
6. **COD** — blocked if cart has digital products; stock decremented at order creation (physical only)
7. **Stripe** — stock decremented in `markOrderPaid` (success page / webhook); digital lines skipped
8. Variant decrement syncs parent product `stock` to variant totals
9. On `PAID` — `grantLibraryAccessForOrder()` adds digital items to user's library

Payment methods: **Cash on Delivery** or **Stripe Checkout** (hosted redirect).

#### Stripe (test mode)

Set in `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Goal    | Test card          | Result                                                               |
| ------- | ------------------ | -------------------------------------------------------------------- |
| Success | `4242424242424242` | Redirect to `/checkout/success?orderId=…&session_id=…`               |
| Decline | `4000000000000002` | Stripe shows error → click **← Back** → `/checkout/cancel?orderId=…` |

Use any future expiry (e.g. `12/34`) and any valid CVC. `STRIPE_WEBHOOK_SECRET` is optional locally — payment can be confirmed on the success page via `session_id`.

Optional local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Commerce patterns

- Home shelves — Strategy/Composer (`lib/commerce/HomeShelfStrategy.ts`)
- Catalog sort — `SortStrategyRegistry` (shared by UI labels, Redux, and Prisma `orderBy`)
- Category nav — `CategoryCatalog.fromTree()` + `useCategoryNav()`

---

## Auth

Authentication and account recovery. Minimal `AuthShell` layout (no storefront chrome).

### Routes

| Route              | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `/login`           | Credentials + optional Google/GitHub OAuth |
| `/register`        | New account + verification email           |
| `/verify-email`    | Email verification token handler           |
| `/verified`        | Post-verification success                  |
| `/forgot-password` | Request reset email                        |
| `/reset-password`  | Set new password from token                |

### Stack

| Piece                              | Location                                                |
| ---------------------------------- | ------------------------------------------------------- |
| NextAuth v5 (JWT sessions)         | `lib/auth.config.ts`, `lib/auth.ts`                     |
| Credentials provider               | `lib/auth.ts`                                           |
| Google / GitHub OAuth (optional)   | `lib/auth.ts` — env-gated providers                     |
| Prisma adapter (OAuth-safe)        | `lib/auth/prisma-adapter.ts`                            |
| Account linking by email           | `allowDangerousEmailAccountLinking` + `signIn` callback |
| Registration / verify / reset APIs | `/api/auth/*`                                           |
| Email templates                    | `lib/emails/` (Resend)                                  |
| Session in React                   | `components/providers/AuthProvider.tsx`                 |

### OAuth setup

| Provider | Env vars                                   | Redirect URI                          |
| -------- | ------------------------------------------ | ------------------------------------- |
| Google   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `{AUTH_URL}/api/auth/callback/google` |
| GitHub   | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `{AUTH_URL}/api/auth/callback/github` |

Login buttons appear only when the matching env vars are set (`lib/auth/providers.ts`).

### Account linking (one email = one user)

| Scenario                                                            | Behavior                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Register with email → later sign in with Google/GitHub (same email) | OAuth links to existing `User`; no duplicate row                               |
| OAuth first → try email/password register                           | API returns error — sign in with that provider                                 |
| OAuth first → try email/password login                              | Login hints: _"This account uses Google/GitHub sign-in"_                       |
| OAuth user, no password yet                                         | Banner on My Account prompts **Set password** (optional second sign-in method) |

Trusted providers: `google`, `github` (`lib/auth/account-linking.ts`). Session stores active sign-in method as `user.authProvider` (`credentials` \| `google` \| `github`).

### API routes

| Method   | Route                           | Description                      |
| -------- | ------------------------------- | -------------------------------- |
| *        | `/api/auth/[...nextauth]`       | Sign-in, sign-out, session       |
| POST     | `/api/auth/register`            | Register user                    |
| GET/POST | `/api/auth/verify-email`        | Verify email token               |
| POST     | `/api/auth/resend-verification` | Resend verification              |
| POST     | `/api/auth/forgot-password`     | Send reset link                  |
| POST     | `/api/auth/reset-password`      | Reset password                   |
| POST     | `/api/auth/verification-status` | Verification + OAuth login hints |

### Route protection

`proxy.ts` redirects unauthenticated users to `/login?callbackUrl=…` when they hit:

- `/checkout`
- `/dashboard/*`
- `/admin/*`

### API guards & session polling

`lib/api/guard.ts` applies rate limits, origin checks, and suspicious-URL blocking to `/api/*`.

`/api/auth/session` and `/api/auth/csrf` are **exempt** from strict auth rate limits — `SessionProvider` polls session frequently; blocking these caused `ClientFetchError` overlays on storefront pages.

Locale-prefixed API paths (`/bn/api/…`) are rewritten/redirected to `/api/…` so Auth.js always receives JSON, not an HTML locale page.

---

## User dashboard (My Account)

Signed-in customer area using `AccountShell` with sidebar navigation. **Admins and super admins can use it too** — it is separate from the admin panel.

### Dual dashboard (admin roles)

| Area            | URL prefix     | Purpose                                            |
| --------------- | -------------- | -------------------------------------------------- |
| **My Account**  | `/dashboard/*` | Personal orders, wishlist, library, profile, inbox |
| **Admin panel** | `/admin/*`     | Store management (products, orders, users)         |

Navigation:

- Storefront header user icon → `/dashboard`
- My Account sidebar → **Admin panel** (`/admin`) when role is `ADMIN` or `SUPER_ADMIN`
- Admin panel header → **My Account** (`/dashboard`) with `UserAvatar` when profile image exists
- Login respects `callbackUrl` (no forced redirect to `/admin`)

`canAccessDashboard()` allows `USER`, `ADMIN`, `SUPER_ADMIN`. `canAccessAdmin()` gates `/admin/*` separately.

### Routes

| Route                      | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `/dashboard`               | Account overview                                                    |
| `/dashboard/orders`        | Order history — **offset** API pagination, debounced search, export |
| `/dashboard/orders/[id]`   | Order detail + PDF download                                         |
| `/dashboard/profile`       | Photo, name, password (provider-aware)                              |
| `/dashboard/addresses`     | Saved shipping addresses (`localStorage`)                           |
| `/dashboard/wishlist`      | Saved products (`/api/wishlist`)                                    |
| `/dashboard/reviews`       | User product reviews                                                |
| `/dashboard/library`       | Digital library — purchased downloads + secure access               |
| `/dashboard/notifications` | Order update inbox — unread badge in sidebar                        |
| `/dashboard/settings`      | Sign-in method badge, account security                              |

### Notifications inbox

Order status changes create rows in the `Notification` model (`lib/services/notifications.ts`):

| Trigger status | Inbox message (examples) |
| -------------- | ------------------------ |
| `PAID`         | Payment confirmed        |
| `SHIPPED`      | Order shipped            |
| `DELIVERED`    | Order delivered          |
| `CANCELLED`    | Order cancelled          |

Created by `notifyOrderStatusChange()` from `updateOrderStatus()` (admin) and `markOrderPaid()` (Stripe/COD payment). UI: `NotificationsPanel`, `hooks/use-notifications.ts`. APIs: `GET/PATCH /api/notifications`, `PATCH /api/notifications/[id]`.

### Digital library

Permanent access to purchased **digital** products (eBooks, PDFs, templates — not physical order tracking).

| Concept             | Behavior                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| `Product.isDigital` | Admin toggle; `digitalAssetUrl` required when true                                |
| Stock               | Digital items skip inventory checks/decrement; always sellable                    |
| Shipping            | All-digital carts → `$0` shipping                                                 |
| COD                 | Blocked when cart contains any digital product                                    |
| Grant access        | `grantLibraryAccessForOrder()` on `PAID` (`markOrderPaid`, admin status → `PAID`) |
| Download            | `GET /api/library/[productId]` — owner check → redirect to `digitalAssetUrl`      |

Service: `lib/services/library.ts`. UI: `AccountLibraryPanel`, `app/[locale]/(user)/dashboard/library/page.tsx`. Helpers: `lib/utils/digital-products.ts`.

```typescript
// lib/services/library.ts
await grantLibraryAccessForOrder(orderId) // upserts LibraryItem per digital line
const target = await getLibraryDownloadTarget(userId, productId) // ownership + URL
```

Demo seed: 3 digital products + 2 library items for `customer@demo.com` via a paid order.

### Profile photo & avatars

| Sign-in method      | Avatar source                                                        | Profile UI                              |
| ------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| **Credentials**     | Cloudinary upload (`cartpulse/avatars/`) — JPG, JPEG, PNG, WebP, SVG | Upload / change / remove                |
| **Google / GitHub** | Provider profile image (stored in `User.image` on sign-in)           | Read-only; synced on each OAuth sign-in |

Components: `ProfileAvatarSection`, `UserAvatar`. APIs: `POST/DELETE /api/user/avatar` (credentials sessions only).

### OAuth password banner

When a user signs in with Google/GitHub and has **no password** yet, `PasswordBanner` on My Account suggests adding email + password sign-in. Dismissible via **Not now** (`localStorage`). Links to `/dashboard/profile` → **Set a password**.

### Settings vs profile (provider-aware)

| Page                  | Credentials session                               | OAuth session                                                  |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `/dashboard/settings` | Active method badge + **Edit profile & password** | Active method badge only (e.g. Google); no password edit       |
| `/dashboard/profile`  | Full edit: avatar upload, name, change password   | OAuth photo (read-only), optional **Set password** if none yet |

### Access

`canAccessDashboard()` in `lib/auth-access.ts` — roles `USER`, `ADMIN`, `SUPER_ADMIN`.

### User APIs

| Method          | Route                      | Description                                      |
| --------------- | -------------------------- | ------------------------------------------------ |
| GET             | `/api/orders`              | Current user's orders                            |
| GET             | `/api/orders/[id]`         | Order detail (owner or admin)                    |
| GET             | `/api/orders/[id]/pdf`     | Order PDF (owner or admin)                       |
| GET/POST/DELETE | `/api/wishlist`            | Wishlist CRUD                                    |
| GET/POST        | `/api/reviews`             | Product reviews                                  |
| PATCH           | `/api/user/profile`        | Update name / password                           |
| POST/DELETE     | `/api/user/avatar`         | Upload / remove profile photo (credentials only) |
| GET/PATCH       | `/api/notifications`       | List inbox + unread count; mark all read         |
| PATCH           | `/api/notifications/[id]`  | Mark one notification read                       |
| GET             | `/api/library/[productId]` | Secure download redirect (library owner only)    |

Order export uses `mapUserOrderRowsForExport` in `lib/export/admin-table-rows.ts` with `UserOrdersTable` + `TableExportMenu`.

---

## Admin

Back-office panel using `AdminLayout` — sidebar, permission-aware actions, data tables with export. Header includes **My Account** (profile avatar when set) and **View storefront** links.

### Order status → customer notification

When an admin updates order status via `PATCH /api/orders/[id]`, `updateOrderStatus()` calls `notifyOrderStatusChange()` so the order owner sees an inbox item at `/dashboard/notifications`.

### Routes

| Route                  | Purpose                                          | Access               |
| ---------------------- | ------------------------------------------------ | -------------------- |
| `/admin`               | Overview KPIs + charts                           | ADMIN, SUPER_ADMIN   |
| `/admin/products`      | Product list + export                            | ADMIN, SUPER_ADMIN   |
| `/admin/products/new`  | Create product                                   | ADMIN (`permCreate`) |
| `/admin/products/[id]` | Edit product — variants (color/size), stock sync | ADMIN (`permUpdate`) |
| `/admin/orders`        | Order list + export                              | ADMIN, SUPER_ADMIN   |
| `/admin/orders/[id]`   | Order detail, status actions, PDF                | ADMIN, SUPER_ADMIN   |
| `/admin/categories`    | Category tree CRUD                               | ADMIN, SUPER_ADMIN   |
| `/admin/stores`        | Store management                                 | ADMIN, SUPER_ADMIN   |
| `/admin/coupons`       | Coupon CRUD                                      | ADMIN, SUPER_ADMIN   |
| `/admin/users`         | User list, roles, permissions                    | **SUPER_ADMIN only** |
| `/admin/analytics`     | Revenue / order analytics                        | **SUPER_ADMIN only** |
| `/admin/activity`      | Admin activity audit log                         | **SUPER_ADMIN only** |
| `/admin/settings`      | Platform settings                                | **SUPER_ADMIN only** |

### Access control

| Layer             | Mechanism                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Route gate        | `proxy.ts` — non-admins redirected from `/admin/*`                                             |
| Super-admin paths | `SUPER_ADMIN_ONLY_PATHS` in `lib/auth-access.ts`                                               |
| CRUD permissions  | `User.permCreate/Read/Update/Delete` checked via `requireAdminAction()` in `lib/admin-auth.ts` |

### Product admin — variants, stock & digital

- **Digital product** toggle — download URL required; no stock/variants needed
- **Variant type** dropdown: `COLOR` or `SIZE`
- **Color variants** — SKU, color name, swatch hex, per-variant stock
- **Size variants** — SKU, size name, per-variant stock (no swatch)
- Incomplete variant rows are validated; color can auto-fill from SKU
- When variants exist, root stock field is disabled and shows live total
- Server sync: `resolveUpdatedStock()` / `computeProductStockFromFormValues()` in `lib/services/admin-products.ts`

### Admin APIs

| Method           | Route                        | Description             |
| ---------------- | ---------------------------- | ----------------------- |
| GET/POST         | `/api/admin/products`        | List / create           |
| GET/PATCH/DELETE | `/api/admin/products/[id]`   | Product CRUD            |
| GET/POST         | `/api/admin/categories`      | Category list / create  |
| GET/PATCH/DELETE | `/api/admin/categories/[id]` | Category CRUD           |
| GET/POST         | `/api/admin/stores`          | Store list / create     |
| GET/PATCH/DELETE | `/api/admin/stores/[id]`     | Store CRUD              |
| GET/POST         | `/api/admin/coupons`         | Coupon list / create    |
| GET/PATCH/DELETE | `/api/admin/coupons/[id]`    | Coupon CRUD             |
| GET              | `/api/admin/users`           | User list               |
| PATCH/DELETE     | `/api/admin/users/[id]`      | Role + permissions      |
| GET              | `/api/admin/analytics`       | Dashboard analytics     |
| GET              | `/api/admin/activity`        | Activity log            |
| POST/DELETE      | `/api/admin/upload`          | Cloudinary image upload |

Activity logging: `lib/services/activity-log.ts` records admin actions (create/update/delete) for the audit table.

### Table export

Current page rows → XLSX or CSV via `lib/export/spreadsheet.ts` and `components/admin/TableExportMenu.tsx`.

---

## Roles & permissions

| Role          | Dashboard (`/dashboard`) | Admin panel | Super-admin sections | Default CRUD (ADMIN)              |
| ------------- | ------------------------ | ----------- | -------------------- | --------------------------------- |
| `USER`        | Yes                      | No          | —                    | —                                 |
| `ADMIN`       | Yes (personal account)   | Yes (most)  | No                   | create/read/update on; delete off |
| `SUPER_ADMIN` | Yes (personal account)   | Yes (all)   | Yes                  | all on                            |

Demo accounts (seeded):

| Role        | Email                     | Password      |
| ----------- | ------------------------- | ------------- |
| SUPER_ADMIN | `superadmin@platform.com` | `password123` |
| ADMIN       | `admin@platform.com`      | `password123` |
| USER        | `customer@demo.com`       | `password123` |

---

## Public storefront APIs

| Method | Route                  | Description                                                             |
| ------ | ---------------------- | ----------------------------------------------------------------------- |
| GET    | `/api/products`        | **Cursor**-paginated list (`cursor`, `pageSize`, filters, search, sort) |
| GET    | `/api/products?ids=`   | Batch by id (cart / wishlist hydration)                                 |
| GET    | `/api/products/[slug]` | Single product (download URL stripped from public DTO)                  |
| GET    | `/api/categories`      | Category tree (CDN-cached)                                              |
| GET    | `/api/stores`          | Published stores (CDN-cached)                                           |
| GET    | `/api/coupons`         | Validate coupon                                                         |
| POST   | `/api/coupons`         | Apply coupon (checkout)                                                 |
| POST   | `/api/checkout`        | Create order (COD or Stripe session)                                    |
| POST   | `/api/webhooks/stripe` | Stripe payment webhook                                                  |

Admin tables and My Orders use **offset** pagination (`page` / `pageSize` / `total`) — see `lib/api/pagination.ts`.

Admin `PATCH /api/orders/[id]` updates order status (admin-only).

---

## Cross-cutting concerns

| Topic                 | Implementation                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| **i18n**              | `next-intl` — locales `en`, `bn`; `localePrefix: 'as-needed'`                                                |
| **Route protection**  | `proxy.ts` — auth gates only for `/admin`, `/dashboard`, `/checkout`; public shop skips NextAuth for ISR/CDN |
| **Pagination**        | Cursor (storefront Load more) vs offset (admin / My Orders) — `lib/api/pagination.ts`                        |
| **Search debounce**   | `hooks/use-debounced-value.ts` + `SEARCH_DEBOUNCE_MS` (600)                                                  |
| **Product search**    | Token match — `lib/utils/product-search.ts` (avoids mid-word hits like `mobile` ⊂ `automobiles`)             |
| **CDN cache**         | Public catalog GETs — `PUBLIC_CATALOG_CACHE_CONTROL` (`s-maxage=60`)                                         |
| **Prisma Accelerate** | `DATABASE_ACCELERATE_URL` + `lib/api/accelerate-cache.ts` `cacheStrategy` presets                            |
| **Cart persistence**  | Redux → `localStorage`; clear after `yarn db:reset` (see README)                                             |
| **Order PDF**         | `@react-pdf/renderer` in `lib/pdf/OrderDetailPdfDocument.tsx`                                                |
| **Soft deletes**      | `deletedAt` on users/products; `lib/services/soft-delete.ts`                                                 |
| **Image upload**      | Cloudinary — admin products (`/api/admin/upload`), user avatars (`/api/user/avatar`)                         |
| **User.image**        | OAuth profile photo or Cloudinary avatar URL on `User` model                                                 |
| **Notifications**     | `Notification` model — order status inbox per user; `NotificationType.ORDER_UPDATE`                          |
| **Cart validation**   | `lib/validations/cart.ts` — Zod schema + `sanitizeCartItemsById()` at checkout                               |
| **Digital products**  | `isDigital` + `digitalAssetUrl` on Product; `lib/utils/digital-products.ts`                                  |
| **Library**           | `LibraryItem` model — `grantLibraryAccessForOrder()` on paid orders                                          |

---

## Design patterns

Hybrid architecture: OOP for domain/data layers, functional modules for auth guards and thin API facades.

### Server

| Pattern     | Where                                | Purpose                               |
| ----------- | ------------------------------------ | ------------------------------------- |
| Repository  | `lib/repositories/`                  | Prisma queries, DTO mapping           |
| Service     | `lib/services/`                      | Business rules, transactions          |
| Strategy    | `lib/commerce/`                      | Sort, shelves, pricing algorithms     |
| Facade      | `lib/commerce/`, `lib/services/*.ts` | Stable entry points                   |
| Guard union | `lib/admin-auth.ts`                  | `{ user } \| { error: NextResponse }` |

```
API route → lib/services/*.ts → Service → Repository → Prisma
Storefront → lib/commerce/* → Service / Repository
```

### React

| Pattern             | Where                                                       | Purpose                            |
| ------------------- | ----------------------------------------------------------- | ---------------------------------- |
| Provider + hook     | `components/providers/`                                     | Auth, Redux, Query, theme          |
| Factory provider    | `lib/react/createEntityDrawerProvider.tsx`                  | Admin entity drawers               |
| Container/presenter | `components/dashboard/Admin*Page.tsx`                       | Page owns data; table is presenter |
| Custom hooks        | `hooks/use-cart`, `use-notifications`, `use-admin-resource` | URL ↔ Redux ↔ fetch                |

---

## Catalog & seed data

Top-level categories: `Electronics & Gadget` · `Personal Care` · `Appliances` · `Kitchen & Dining` · `Food & Grocery` · `Fashion` · `Automobiles & Helmets` · `Health Care`

- **200** published products (+ 1 draft), **3** digital demo products, category-curated **Unsplash** images (runtime remap for old DB URLs)
- **8** stores (several verified)

Regenerate and reseed:

```bash
yarn generate:data
yarn db:seed
```

Full wipe:

```bash
yarn db:reset
# then clear localStorage + cookies — see README
# db:reset requires DATABASE_URL as a direct postgres:// URL (not Accelerate)
```
