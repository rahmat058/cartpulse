# CartPulse

Next.js 16 e-commerce platform with PostgreSQL, Redux cart, NextAuth, Stripe/COD checkout, and customer + admin dashboards.

For architecture, routes, roles, APIs, and design patterns — see **[ARCHITECTURE.MD](./ARCHITECTURE.MD)**.

For **service docs, role guides, and feature checklist** — see **[docs/](./docs/)**.

---

## Prerequisites

| Requirement    | Version / notes                       |
| -------------- | ------------------------------------- |
| **Node.js**    | `24.11.0` (see `package.json engines`)              |
| **Yarn**       | Package manager for this repo         |
| **PostgreSQL** | Local instance or hosted Postgres URL |

---

## First-time setup

### 1. Clone and install

```bash
cd cartpulse
nvm use          # installs/uses Node 24.11.0 from .nvmrc
yarn install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable              | Required | Notes                                 |
| --------------------- | -------- | ------------------------------------- |
| `DATABASE_URL`        | Yes      | PostgreSQL connection string          |
| `AUTH_SECRET`         | Yes      | `openssl rand -base64 32`             |
| `AUTH_URL`            | Yes      | `http://localhost:3000` for local dev |
| `NEXT_PUBLIC_APP_URL` | Yes      | Same as `AUTH_URL` locally            |

Optional (enable features when set):

| Variable                                                                                 | Enables                                                              |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `RESEND_API_KEY` + `EMAIL_FROM`                                                          | Registration verification, password reset, order emails              |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                               | Card checkout                                                        |
| `CLOUDINARY_URL` (or split keys)                                                         | Admin product upload + **profile avatar** upload (credentials users) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google & GitHub OAuth sign-in                                        |

### 3. Database

```bash
yarn db:push      # apply Prisma schema + generate client
yarn generate:data  # build data/products.json (200 products)
yarn db:seed      # seed stores, categories, products, coupons, demo users
```

`postinstall` runs `prisma generate` automatically after `yarn install`.

### 4. Start the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Bengali UI is available at [http://localhost:3000/bn](http://localhost:3000/bn).

### OAuth (optional — Google & GitHub)

1. Copy values from `.env.example` into `.env`
2. Configure redirect URIs in each provider console:

| Provider | Authorized JavaScript origin           | Authorized redirect URI                          |
| -------- | -------------------------------------- | ------------------------------------------------ |
| Google   | `http://localhost:3000`                | `http://localhost:3000/api/auth/callback/google` |
| GitHub   | `http://localhost:3000` (Homepage URL) | `http://localhost:3000/api/auth/callback/github` |

3. Restart `yarn dev` after changing `.env`

**Account linking:** One email = one user. If someone registers with email/password and later signs in with Google/GitHub using the same email, the OAuth account links automatically (no duplicate user).

---

## Demo accounts

Seeded by `yarn db:seed`:

| Role        | Email                     | Password      | Primary panel | Personal dashboard        |
| ----------- | ------------------------- | ------------- | ------------- | ------------------------- |
| Super Admin | `superadmin@platform.com` | `password123` | `/admin`      | `/dashboard` (also works) |
| Admin       | `admin@platform.com`      | `password123` | `/admin`      | `/dashboard` (also works) |
| Customer    | `customer@demo.com`       | `password123` | —             | `/dashboard`              |

**Admins & super admins** have two areas: **Admin panel** (`/admin`) for store management and **My Account** (`/dashboard`) for personal orders, wishlist, **digital library**, notifications, and profile. Cross-links: header **My Account** (with profile photo when set), sidebar **Admin panel**, storefront header user icon → `/dashboard`.

**Digital products:** Admins can mark products as digital with a download URL. After payment, items appear in the customer **Library** (`/dashboard/library`) with secure download via `/api/library/[productId]`. Demo customer seed includes 2 library items from a paid order.

---

## Scripts

| Command              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `yarn dev`           | Next.js dev server (Turbopack)                           |
| `yarn build`         | Production build                                         |
| `yarn start`         | Run production server                                    |
| `yarn lint`          | ESLint                                                   |
| `yarn typecheck`     | `tsc --noEmit`                                           |
| `yarn db:push`       | Push schema to DB + regenerate Prisma Client             |
| `yarn db:generate`   | Regenerate Prisma Client only                            |
| `yarn db:seed`       | Seed demo data                                           |
| `yarn db:studio`     | Prisma Studio                                            |
| `yarn db:test`       | Smoke-test DB counts                                     |
| `yarn generate:data` | Regenerate `data/products.json`                          |
| `yarn db:reset`      | **DROP + CREATE** database → push → generate data → seed |

---

## After pulling changes

If `prisma/schema.prisma` changed:

```bash
nvm use
yarn install
yarn db:push
yarn db:seed    # optional — only if you need fresh demo data
yarn dev
```

Restart the dev server after schema or `.env` changes.

---

## Database reset

`yarn db:reset` wipes PostgreSQL only. Clear browser state afterward or you may see a stale cart badge or signed-in name:

1. DevTools → **Application** → **Local Storage** → remove `cartpulse*` keys, or run:

```js
Object.keys(localStorage)
  .filter((k) => k.startsWith('cartpulse'))
  .forEach((k) => localStorage.removeItem(k))
```

2. Clear site cookies for `localhost` (NextAuth session), or sign out
3. Hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`)
4. Sign in again with a demo account above

---

## Troubleshooting

| Problem                                  | Fix                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Wrong Node version                       | `nvm install 24.11.0 && nvm use`                                                                                   |
| `Failed to fetch products` / API 500     | Check `DATABASE_URL`, then `yarn db:push && yarn db:seed`                                                          |
| Stale cart or user name after `db:reset` | Clear `cartpulse*` localStorage + auth cookies (see above)                                                         |
| Prisma client out of date                | `yarn db:generate` or `yarn db:push`                                                                               |
| Auth.js `ClientFetchError` on storefront | Ensure dev server is running; `/api/auth/session` must not be blocked (see ARCHITECTURE)                           |
| Google/GitHub `AccessDenied` on sign-in  | Restart dev server after auth code changes; ensure redirect URIs match table above exactly                         |
| OAuth `Configuration` / server error     | Check terminal logs; ensure `User.image` column exists (`yarn db:push`) and Cloudinary is set if uploading avatars |
| Stripe checkout not redirecting          | Set Stripe keys in `.env`, restart `yarn dev`, choose **Card / Stripe** at checkout                                |
| Avatar upload fails                      | Set `CLOUDINARY_*` in `.env`; only available when signed in with **email + password**                              |
| Notifications inbox empty after ship     | Run `yarn db:push` (adds `notifications` table); change order status again — old updates are not backfilled        |
| Library empty after buying digital item  | Order must reach `PAID`; run `yarn db:push` (digital fields + `library_items`); re-seed for demo library items     |
| Admin cannot find personal dashboard     | Go to `/dashboard` or click **My Account** in admin header / storefront header (not auto-redirected on login)      |

Stripe test cards and webhook setup are documented in **[ARCHITECTURE.MD](./ARCHITECTURE.MD)** under **Storefront → Checkout**.
