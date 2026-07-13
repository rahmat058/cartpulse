# CartPulse — Feature Checklist

Living checklist for CartPulse. Legend:

| Symbol | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| ✅     | Done and working                                            |
| 🔶     | Partial — placeholder, env-dependent, or needs manual setup |
| ❌     | Not started                                                 |

**Last reviewed:** July 2026 · **Stack:** Next.js 16, React 19, Prisma 7 + Accelerate, PostgreSQL, NextAuth v5, Stripe, Tailwind v4

---

## Summary

| Area                | Status | Notes                                           |
| ------------------- | ------ | ----------------------------------------------- |
| Foundation & theme  | ✅     | Node 24.11.0, dark/light mode                   |
| Auth                | ✅     | Credentials + OAuth linking + avatars           |
| Storefront          | ✅     | Catalog, cursor Load more, cart, checkout, ISR  |
| User dashboard      | ✅     | Orders (offset API), library, profile, notifs   |
| Admin panel         | ✅     | CRUD, server offset tables, export, permissions |
| Super admin         | ✅     | Users, analytics, activity, settings            |
| Services layer      | ✅     | 23 modules + pagination helpers documented      |
| Inventory           | ✅     | Stock decrement on COD + Stripe pay             |
| i18n (en/bn)        | 🔶     | Routing works; translation coverage varies      |
| Email (Resend)      | 🔶     | Requires `RESEND_API_KEY`                       |
| Stripe              | 🔶     | Requires test keys in `.env`                    |
| Notifications inbox | ✅     | Order status inbox + sidebar badge              |
| Digital library     | ✅     | Buy, grant on PAID, download via secure API     |

---

## Phase 0 — Foundation

| #    | Feature                                 | Status |
| ---- | --------------------------------------- | ------ |
| 0.1  | Next.js 16 + React 19 + TypeScript      | ✅     |
| 0.2  | Tailwind v4 + ShadcnUI primitives       | ✅     |
| 0.3  | Prisma 7 + PostgreSQL                   | ✅     |
| 0.4  | ESLint, Prettier, `typecheck` script    | ✅     |
| 0.5  | Feature-based folder structure          | ✅     |
| 0.6  | Dark / light mode (`next-themes`)       | ✅     |
| 0.7  | `StorefrontShell` layout                | ✅     |
| 0.8  | `AccountShell` (user dashboard sidebar) | ✅     |
| 0.9  | `AdminLayout` (admin sidebar)           | ✅     |
| 0.10 | Mobile collapsible sidebars             | ✅     |
| 0.11 | Bengali locale routing (`/bn/*`)        | ✅     |
| 0.12 | Full Bengali UI copy                    | 🔶     |

---

## Phase 1 — Auth

| #    | Feature                                   | Status |
| ---- | ----------------------------------------- | ------ |
| 1.1  | NextAuth v5 JWT sessions                  | ✅     |
| 1.2  | Credentials provider                      | ✅     |
| 1.3  | GitHub OAuth                              | 🔶     | Needs `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`; callback `/api/auth/callback/github` |
| 1.4  | Google OAuth                              | 🔶     | Needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; callback `/api/auth/callback/google` |
| 1.5  | Roles: `USER`, `ADMIN`, `SUPER_ADMIN`     | ✅     |
| 1.6  | `/login`, `/register` pages               | ✅     |
| 1.7  | Email verification flow                   | 🔶     | Needs `RESEND_API_KEY`                                                                  |
| 1.8  | Forgot / reset password                   | 🔶     | Needs `RESEND_API_KEY`                                                                  |
| 1.9  | `proxy.ts` route protection               | ✅     |
| 1.10 | API guards (rate limit, origin check)     | ✅     |
| 1.11 | Auth session rate-limit exemption         | ✅     | Fixes `ClientFetchError` on storefront                                                  |
| 1.12 | Locale-prefixed API rewrite (`/bn/api/*`) | ✅     |
| 1.13 | OAuth account linking (same email)        | ✅     | Google/GitHub link to existing credentials user                                         |
| 1.14 | OAuth login hints on wrong method         | ✅     | `verification-status` + login form messages                                             |
| 1.15 | Session `authProvider` (active sign-in)   | ✅     | `credentials` \| `google` \| `github` in JWT/session                                    |
| 1.16 | Custom Prisma adapter for OAuth           | ✅     | `lib/auth/prisma-adapter.ts` — `User.image` field                                       |

---

## Phase 2 — Storefront

| #    | Feature                                              | Status |
| ---- | ---------------------------------------------------- | ------ |
| 2.1  | Homepage + featured products                         | ✅     |
| 2.2  | Strategy-driven home shelves                         | ✅     |
| 2.3  | `/products` catalog grid + list view                 | ✅     |
| 2.4  | `/products/[slug]` PDP (SSR)                         | ✅     |
| 2.5  | Search with debounce + server query                  | ✅     | `useDebouncedValue` (300ms)                   |
| 2.6  | Sidebar filters (category, price, rating, stock)     | ✅     |
| 2.7  | URL-synced `searchParams`                            | ✅     |
| 2.8  | Sort strategies (price, rating, newest, name)        | ✅     |
| 2.9  | Active filter chips + clear all                      | ✅     |
| 2.10 | `ProductCard` grid + list variants                   | ✅     |
| 2.11 | Skeleton loaders                                     | ✅     |
| 2.12 | Quick add to cart on card                            | ✅     |
| 2.13 | `/stores` directory                                  | ✅     |
| 2.14 | `/stores/[slug]` store page                          | ✅     |
| 2.15 | Color variants (swatches)                            | ✅     |
| 2.16 | Size variants (text buttons)                         | ✅     |
| 2.17 | `variantType` COLOR \| SIZE on Product               | ✅     |
| 2.18 | Hide out-of-stock variants on PDP                    | ✅     |
| 2.19 | `resolveProductStock()` sold-out checks              | ✅     |
| 2.20 | Product reviews on PDP                               | ✅     |
| 2.21 | Related products                                     | ✅     |
| 2.22 | Recently viewed (`localStorage`)                     | ✅     |
| 2.23 | Info pages (`/help`, `/about`, `/contact`, `/terms`) | ✅     |
| 2.24 | Bilingual storefront copy (en/bn)                    | 🔶     | Routing + key pages; coverage varies          |
| 2.25 | Digital product badge on catalog + PDP               | ✅     | `Product.isDigital`; instant delivery copy    |
| 2.26 | Cursor pagination (Load more)                        | ✅     | `cursor` / `nextCursor`; no full-catalog dump |
| 2.27 | Homepage ISR + limited shelf `pageSize`              | ✅     | `revalidate = 60`; shelves request 8–20       |
| 2.28 | Token-aware product search + 600ms debounce          | ✅     | `product-search.ts`; header clears stale hits |
| 2.29 | Layout-aware catalog / PDP skeletons                 | ✅     | Catalog scoped; `ProductDetailSkeleton`       |

---

## Phase 3 — Cart & Checkout

| #    | Feature                                             | Status |
| ---- | --------------------------------------------------- | ------ |
| 3.1  | Redux cart (`productId` + `variantId` key)          | ✅     |
| 3.2  | Derived pricing (subtotal, tax, shipping, discount) | ✅     |
| 3.3  | `localStorage` cart persistence                     | ✅     |
| 3.4  | Cart drawer + floating badge                        | ✅     |
| 3.5  | Quantity stepper with stock clamping                | ✅     |
| 3.6  | Promo code input                                    | ✅     |
| 3.7  | Free shipping progress bar                          | ✅     |
| 3.8  | `/cart` full-page view                              | ✅     |
| 3.9  | Checkout requires login                             | ✅     |
| 3.10 | Server-side price re-fetch at checkout              | ✅     | Zod validation + `sanitizeCartItemsById`; variant-aware `resolveLineUnitPrice` |
| 3.11 | Shipping address form                               | ✅     |
| 3.12 | COD payment method                                  | ✅     |
| 3.13 | Stripe Checkout redirect                            | 🔶     | Needs Stripe keys                                                              |
| 3.14 | `/checkout/success` page                            | ✅     |
| 3.15 | `/checkout/cancel` page                             | ✅     |
| 3.16 | Stripe webhook handler                              | 🔶     | Optional locally                                                               |
| 3.17 | Order confirmation email                            | 🔶     | Needs Resend                                                                   |
| 3.18 | Admin new-order alert email                         | 🔶     | Needs Resend                                                                   |
| 3.19 | Inventory decrement (COD)                           | ✅     |
| 3.20 | Inventory decrement (Stripe on pay)                 | ✅     |
| 3.21 | Variant stock sync to product total                 | ✅     |
| 3.22 | Digital products — no shipping when all-digital     | ✅     | `cartIsAllDigital()` in `cartPricing.ts`                                       |
| 3.23 | COD blocked for carts with digital items            | ✅     | Server + checkout UI                                                           |
| 3.24 | Digital lines skip inventory decrement              | ✅     | `inventory.ts` + `isDigitalProduct()`                                          |

---

## Phase 4 — User Dashboard

| #    | Feature                                   | Status |
| ---- | ----------------------------------------- | ------ |
| 4.1  | `/dashboard` overview                     | ✅     |
| 4.2  | Sidebar navigation                        | ✅     |
| 4.3  | Orders table (search, filter, pagination) | ✅     | Server offset via `GET /api/orders`; debounced search  |
| 4.4  | Orders CSV / XLSX export                  | ✅     |
| 4.5  | Order detail + line items                 | ✅     |
| 4.6  | Order PDF download                        | ✅     |
| 4.7  | Profile edit (name, password)             | ✅     | Provider-aware: credentials vs OAuth                   |
| 4.8  | Profile avatar upload (credentials)       | 🔶     | Needs `CLOUDINARY_*`; JPG/PNG/WebP/SVG                 |
| 4.9  | OAuth profile photo (read-only)           | ✅     | Google/GitHub image in `User.image`                    |
| 4.10 | OAuth “Set password” banner               | ✅     | Optional second sign-in method                         |
| 4.11 | Saved addresses (`localStorage`)          | ✅     |
| 4.12 | Wishlist (API-synced)                     | ✅     |
| 4.13 | User reviews history                      | ✅     |
| 4.14 | Digital library page                      | ✅     | `AccountLibraryPanel`, download API, seed demo items   |
| 4.15 | Notifications inbox (order updates)       | ✅     | `Notification` model; PAID/SHIPPED/DELIVERED/CANCELLED |
| 4.16 | Account settings (sign-in method badge)   | ✅     | Shows active session provider only                     |
| 4.17 | Dual dashboard for admin roles            | ✅     | `/dashboard` + `/admin` cross-links                    |

---

## Phase 5 — Admin Dashboard

| #    | Feature                                 | Status |
| ---- | --------------------------------------- | ------ |
| 5.1  | `/admin` KPI overview                   | ✅     |
| 5.2  | Admin sidebar navigation                | ✅     |
| 5.3  | Products table + search + pagination    | ✅     | Server offset + debounced search                |
| 5.4  | Products CSV / XLSX export              | ✅     |
| 5.5  | Create / edit product form              | ✅     |
| 5.6  | Variant management (COLOR + SIZE)       | ✅     |
| 5.7  | Root stock disabled when variants exist | ✅     |
| 5.8  | Server stock sync on save               | ✅     |
| 5.9  | Cloudinary image upload                 | 🔶     | Products + user avatars; needs `CLOUDINARY_URL` |
| 5.10 | Publish / unpublish toggle              | ✅     |
| 5.11 | Soft delete products                    | ✅     |
| 5.12 | Orders table + export                   | ✅     |
| 5.13 | Order status updates                    | ✅     |
| 5.14 | Order detail + PDF                      | ✅     |
| 5.15 | Categories tree CRUD                    | ✅     |
| 5.16 | Stores CRUD                             | ✅     |
| 5.17 | Coupons CRUD                            | ✅     |
| 5.18 | Fine-grained ADMIN permissions          | ✅     |
| 5.19 | Activity audit log                      | ✅     |
| 5.20 | Rich text product description (TipTap)  | ✅     |
| 5.21 | Admin header — My Account + storefront  | ✅     | Profile avatar in My Account button             |
| 5.22 | Order status → customer notification    | ✅     | Via `notifyOrderStatusChange()`                 |
| 5.23 | Digital product create/edit             | ✅     | Toggle + download URL in `ProductForm`          |

---

## Phase 6 — Super Admin

| #    | Feature                                | Status |
| ---- | -------------------------------------- | ------ |
| 6.1  | `/admin/users` — user list             | ✅     |
| 6.2  | Role change USER → ADMIN → SUPER_ADMIN | ✅     |
| 6.3  | Per-admin CRUD permission flags        | ✅     |
| 6.4  | Soft delete users                      | ✅     |
| 6.5  | Last super-admin safeguard             | ✅     |
| 6.6  | `/admin/analytics` revenue chart       | ✅     |
| 6.7  | Orders-over-time chart                 | ✅     |
| 6.8  | Top products table                     | ✅     |
| 6.9  | `/admin/activity` audit table          | ✅     |
| 6.10 | `/admin/settings` platform config      | ✅     |
| 6.11 | Super-admin route gate in `proxy.ts`   | ✅     |

---

## Phase 7 — Data & API

| #    | Feature                             | Status |
| ---- | ----------------------------------- | ------ |
| 7.1  | Prisma schema (all models)          | ✅     |
| 7.2  | `VariantType` enum (COLOR, SIZE)    | ✅     |
| 7.3  | Soft deletes (`deletedAt`)          | ✅     |
| 7.4  | Public product API                  | ✅     | Cursor pagination + CDN `s-maxage=60`                       |
| 7.5  | Checkout API                        | ✅     |
| 7.6  | Admin CRUD APIs                     | ✅     | Offset pagination on list routes                            |
| 7.7  | Wishlist / reviews APIs             | ✅     |
| 7.8  | Auth APIs (register, verify, reset) | ✅     |
| 7.9  | User profile + avatar APIs          | ✅     | `PATCH /api/user/profile`, `POST/DELETE /api/user/avatar`   |
| 7.10 | `yarn db:seed` demo data            | ✅     |
| 7.11 | `yarn generate:data` (200 products) | ✅     |
| 7.12 | `yarn db:reset` full wipe script    | ✅     |
| 7.13 | Service layer (23+ modules)         | ✅     |
| 7.14 | `Notification` model + migration    | ✅     | `yarn db:push` required                                     |
| 7.15 | `Product.isDigital` + `LibraryItem` | ✅     | Digital fields + unique `userId_productId`                  |
| 7.16 | `GET /api/library/[productId]`      | ✅     | Ownership check → redirect to asset URL                     |
| 7.17 | Shared pagination helpers           | ✅     | `lib/api/pagination.ts` — cursor vs offset                  |
| 7.18 | Public catalog CDN cache headers    | ✅     | `apiJsonPublic`; proxy skips auth on public GETs            |
| 7.19 | Prisma Accelerate + `cacheStrategy` | ✅     | `DATABASE_ACCELERATE_URL`; presets in `accelerate-cache.ts` |
| 7.20 | Dual DB env (direct + Accelerate)   | ✅     | `DATABASE_URL` CLI; Accelerate for app runtime              |

---

## Phase 8 — Polish & UX

| #    | Feature                                | Status |
| ---- | -------------------------------------- | ------ |
| 8.1  | Loading skeletons                      | ✅     |
| 8.2  | Empty states (cart, orders, wishlist)  | ✅     |
| 8.3  | Error boundary (`app/error.tsx`)       | ✅     |
| 8.4  | Toast notifications (Sonner)           | ✅     |
| 8.5  | Accessible form labels                 | ✅     |
| 8.6  | Keyboard nav in sidebars               | ✅     |
| 8.7  | Out-of-stock rose-600 label            | ✅     |
| 8.8  | Lottie animations (checkout cancel)    | ✅     |
| 8.9  | Order detail PDF (@react-pdf/renderer) | ✅     |
| 8.10 | Admin table export (SheetJS)           | ✅     |

---

## Service documentation

All services documented with code demos:

| Doc                                                        | Modules                                         |
| ---------------------------------------------------------- | ----------------------------------------------- |
| [services/catalog.md](./services/catalog.md)               | products, CatalogService, categories, stores    |
| [services/commerce.md](./services/commerce.md)             | orders, inventory, coupons, Stripe              |
| [services/user-services.md](./services/user-services.md)   | wishlist, reviews, notifications, library       |
| [services/auth-services.md](./services/auth-services.md)   | OAuth, linking, verification-tokens, avatar API |
| [services/admin-services.md](./services/admin-services.md) | admin-*, activity-log                           |
| [services/core-services.md](./services/core-services.md)   | soft-delete, SoftDeleteService                  |

---

## Role documentation

| Doc                                      | Audience            |
| ---------------------------------------- | ------------------- |
| [storefront.md](./storefront.md)         | Public shop         |
| [user-dashboard.md](./user-dashboard.md) | Customer My Account |
| [admin.md](./admin.md)                   | Store operators     |
| [superadmin.md](./superadmin.md)         | Platform owners     |

---

## Known gaps / future work

| Item                                  | Priority | Notes                                      |
| ------------------------------------- | -------- | ------------------------------------------ |
| Push / email notification preferences | Low      | In-app inbox done; no email/push prefs yet |
| Full Bengali translation pass         | Medium   | Routing done; copy may be incomplete       |
| Stripe webhook as primary fulfillment | Low      | Success page works without webhook         |
| Hard delete / data retention policy   | Low      | Soft delete only by design                 |
| Automated E2E tests                   | Medium   | Manual testing documented in README        |
| Co-locate Vercel + Postgres region    | Medium   | Reduces Asia→US hop TTFB on cold cache     |
| `activity-log.ts` strict typing fixes | Low      | Pre-existing `typecheck` warnings          |

---

## Quick verification checklist

After `yarn db:push && yarn db:seed && yarn dev`:

- [ ] Homepage loads with product shelves
- [ ] `/products` filters update URL; Load more uses `nextCursor`
- [ ] Header search for `mobile` does **not** return automobiles-only noise
- [ ] PDP shows color swatches or size buttons
- [ ] Add to cart → drawer shows correct count
- [ ] Sign in as `customer@demo.com` → checkout works (COD for physical items)
- [ ] Sign in as `customer@demo.com` → `/dashboard/library` shows 2 digital downloads
- [ ] Buy a digital product (search “eBook” / “Style Guide”) → pay → item appears in Library
- [ ] Admin marks order **Shipped** → customer sees notification at `/dashboard/notifications`
- [ ] `/dashboard/profile` — upload avatar (credentials) or see OAuth photo
- [ ] `/dashboard/settings` — shows sign-in method badge
- [ ] `/dashboard/orders` paginates via API (debounced search) + export
- [ ] Sign in as `admin@platform.com` → `/admin/products` CRUD **and** `/dashboard/orders` personal view
- [ ] Admin tables (products/orders/users) change page without loading full lists
- [ ] Edit product with variants → stock total syncs
- [ ] Sign in as `superadmin@platform.com` → `/admin/users`, `/admin/activity`
- [ ] Buy variant → stock decrements on order

---

## Demo accounts

| Role        | Email                     | Password      |
| ----------- | ------------------------- | ------------- |
| Super Admin | `superadmin@platform.com` | `password123` |
| Admin       | `admin@platform.com`      | `password123` |
| Customer    | `customer@demo.com`       | `password123` |

Setup instructions: [README.md](../README.md)
