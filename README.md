# CartPulse

![CartPulse Marketplace — storefront preview](https://res.cloudinary.com/dcsmzfbrd/image/upload/v1783869820/personal-projects/cartpulse_ta7xuk.png)

**CartPulse** is a full-stack multi-store e-commerce marketplace built with Next.js 16. It includes a public storefront, customer dashboard, admin panel, Prisma + PostgreSQL catalog, Redux cart, NextAuth, Stripe/COD checkout, digital library, and bilingual UI (`en` / `bn`).

**Live demo:** [cartpulse-beta.vercel.app](https://cartpulse-beta.vercel.app)

For architecture, routes, roles, APIs, and design patterns — see **[ARCHITECTURE.MD](./ARCHITECTURE.MD)**.

For **service docs, role guides, and feature checklist** — see **[docs/](./docs/)**.

---

## Tech Stack

### Core

<div>
<img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
<img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
<img src="https://img.shields.io/badge/TypeScript_5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
<img src="https://img.shields.io/badge/Node.js_24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Motion-000000?style=for-the-badge&logo=framer&logoColor=white">
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
</div>

### Database & API

<div>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white">
<img src="https://img.shields.io/badge/Zod_4-3E63DD?style=for-the-badge&logo=zod&logoColor=white">
<img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white">
<img src="https://img.shields.io/badge/TipTap_3-000000?style=for-the-badge&logo=tiptap&logoColor=white">
</div>

### Auth, state & data fetching

<div>
<img src="https://img.shields.io/badge/NextAuth_v5-000000?style=for-the-badge&logo=auth0&logoColor=white">
<img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white">
<img src="https://img.shields.io/badge/TanStack_Query_5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white">
<img src="https://img.shields.io/badge/TanStack_Table_8-FF4154?style=for-the-badge&logo=react&logoColor=white">
<img src="https://img.shields.io/badge/next--intl_4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
<img src="https://img.shields.io/badge/next--themes-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
</div>

### Payments, email & media

<div>
<img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white">
<img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white">
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white">
<img src="https://img.shields.io/badge/React_Email-000000?style=for-the-badge&logo=react&logoColor=61DAFB">
<img src="https://img.shields.io/badge/React_PDF-000000?style=for-the-badge&logo=react&logoColor=61DAFB">
</div>

### UI & tooling

<div>
<img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white">
<img src="https://img.shields.io/badge/Lucide-000000?style=for-the-badge&logo=lucide&logoColor=white">
<img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=apacheecharts&logoColor=white">
<img src="https://img.shields.io/badge/Swiper_14-6332F6?style=for-the-badge&logo=swiper&logoColor=white">
<img src="https://img.shields.io/badge/Sonner-000000?style=for-the-badge&logo=sonner&logoColor=white">
<img src="https://img.shields.io/badge/ESLint_9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white">
<img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black">
</div>

**Key dependencies:** `@prisma/client` · `@prisma/adapter-pg` · `next-auth` · `@auth/prisma-adapter` · `@reduxjs/toolkit` · `react-redux` · `@tanstack/react-query` · `@tanstack/react-table` · `stripe` · `@stripe/stripe-js` · `next-intl` · `next-themes` · `lucide-react` · `tailwind-merge` · `zod` · `resend` · `cloudinary` · `bcryptjs` · `date-fns` · `xlsx` · `@lottiefiles/dotlottie-react`

---

## Features

- **Storefront** — catalog search/filters (debounced), variants, flash deals, store directory, cart drawer, checkout
- **Catalog pagination** — cursor-based **Load more** (`cursor` / `nextCursor`); never dumps the full catalog
- **Admin / account tables** — server-side offset pagination (`page` / `pageSize`) with debounced search
- **Auth** — credentials + Google/GitHub OAuth, email verification, password reset, role-based access
- **Customer dashboard** — orders, wishlist, reviews, addresses, profile, notifications, digital library
- **Admin panel** — products, stores, categories, coupons, orders, analytics, activity log, export
- **Commerce** — server-side pricing, inventory decrement, COD + Stripe, promo codes, order emails
- **Performance** — homepage ISR (`revalidate = 60`), CDN cache headers on public catalog GETs
- **i18n** — English + Bengali routing (`/bn/*`)

---

## Prerequisites

| Requirement    | Version / notes                        |
| -------------- | -------------------------------------- |
| **Node.js**    | `24.11.0` (see `package.json` engines) |
| **Yarn**       | Package manager for this repo          |
| **PostgreSQL** | Local instance or hosted Postgres URL  |

---

## First-time setup

### 1. Clone and install

```bash
cd cartpulse
nvm use          # installs/uses Node 24.11.0
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
yarn db:push        # apply Prisma schema + generate client
yarn generate:data  # build data/products.json (200 products)
yarn db:seed        # seed stores, categories, products, coupons, demo users
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

**Admins & super admins** have two areas: **Admin panel** (`/admin`) for store management and **My Account** (`/dashboard`) for personal orders, wishlist, **digital library**, notifications, and profile.

**Digital products:** Admins can mark products as digital with a download URL. After payment, items appear in the customer **Library** (`/dashboard/library`) with secure download via `/api/library/[productId]`.

---

## Scripts

| Command                  | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `yarn dev`               | Next.js dev server (Turbopack)                           |
| `yarn build`             | Production build                                         |
| `yarn start`             | Run production server                                    |
| `yarn lint`              | ESLint                                                   |
| `yarn typecheck`         | `tsc --noEmit`                                           |
| `yarn db:push`           | Push schema to DB + regenerate Prisma Client             |
| `yarn db:migrate:deploy` | Apply migrations on production/hosted DB                 |
| `yarn db:generate`       | Regenerate Prisma Client only                            |
| `yarn db:seed`           | Seed demo data                                           |
| `yarn db:studio`         | Prisma Studio                                            |
| `yarn db:test`           | Smoke-test DB counts                                     |
| `yarn generate:data`     | Regenerate `data/products.json`                          |
| `yarn db:reset`          | **DROP + CREATE** database → push → generate data → seed |

---

## Vercel deployment

1. Set env vars in **Vercel → Settings → Environment Variables** (same as `.env`, with production URLs for `AUTH_URL` and `NEXT_PUBLIC_APP_URL`)
2. Use **Node.js 24.x**
3. Push schema + seed against your hosted database before first deploy:

```bash
yarn db:push
yarn generate:data
yarn db:seed
```

4. Redeploy after changing env vars

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
| Catalog / Load more feels empty or stuck | Confirm API returns `meta.nextCursor` / `hasMore`; filters reset the cursor (new first page)                       |
| Slow Vercel TTFB on catalog              | Public catalog GETs should send `Cache-Control` with `s-maxage`; co-locate Vercel region + Postgres near users     |

Stripe test cards and webhook setup are documented in **[ARCHITECTURE.MD](./ARCHITECTURE.MD)** under **Storefront → Checkout**.
