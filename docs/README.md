# CartPulse Documentation

Developer docs for the CartPulse e-commerce platform. For project setup, see the root [README.md](../README.md). For high-level architecture, see [ARCHITECTURE.MD](../ARCHITECTURE.MD).

**Recent updates:** cursor catalog Load more · offset admin/orders tables · search debounce **600ms** · token-aware product search · home ISR + CDN `s-maxage` · **Prisma Accelerate** (`DATABASE_ACCELERATE_URL` + `cacheStrategy` presets). Details: [storefront.md](./storefront.md), [ARCHITECTURE.MD](../ARCHITECTURE.MD#prisma-accelerate).

---

## Documentation map

| Doc                                        | What it covers                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [feature.md](./feature.md)                 | **Feature checklist** — done / partial / not started                                         |
| [storefront.md](./storefront.md)           | Public shop — catalog, cart, checkout, variants                                              |
| [user-dashboard.md](./user-dashboard.md)   | Customer **My Account** — orders, library, notifications, avatars, dual dashboard for admins |
| [admin.md](./admin.md)                     | Admin panel (`ADMIN` role) — includes link to personal dashboard                             |
| [superadmin.md](./superadmin.md)           | Super-admin-only routes and capabilities                                                     |
| [services/README.md](./services/README.md) | Service layer overview and dependency map                                                    |

### Service reference (with code demos)

| Service doc                                                | Modules                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [services/catalog.md](./services/catalog.md)               | `products`, `CatalogService`, `categories`, `stores`, `products-client`                              |
| [services/commerce.md](./services/commerce.md)             | `orders`, `inventory`, `coupons`, `StripeCheckoutService`                                            |
| [services/user-services.md](./services/user-services.md)   | `wishlist`, `reviews`, `notifications`, `library`                                                    |
| [services/auth-services.md](./services/auth-services.md)   | OAuth, account linking, verification tokens, avatar API                                              |
| [services/admin-services.md](./services/admin-services.md) | `admin-products`, `admin-stores`, `admin-categories`, `admin-coupons`, `admin-users`, `activity-log` |
| [services/core-services.md](./services/core-services.md)   | `soft-delete`, `SoftDeleteService`                                                                   |

### Other

| Doc                                                      | What it covers                     |
| -------------------------------------------------------- | ---------------------------------- |
| [database-create-prompt.md](./database-create-prompt.md) | Database / Prisma prompt reference |

---

## Roles at a glance

| Role          | Primary area                               | URL prefix                                                                                           |
| ------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Guest         | Storefront                                 | `/`, `/products`, `/cart`                                                                            |
| `USER`        | My Account                                 | `/dashboard/*`                                                                                       |
| `ADMIN`       | Admin panel + personal My Account          | `/admin/*` and `/dashboard/*`                                                                        |
| `SUPER_ADMIN` | Admin panel + My Account + platform config | `/admin/*`, `/dashboard/*`, `/admin/users`, `/admin/analytics`, `/admin/activity`, `/admin/settings` |

Demo logins are in the root [README.md](../README.md#demo-accounts).
