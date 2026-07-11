# Auth Services

Modules: `verification-tokens.ts`, `email-verification.ts`

Used during registration and email verification — not for session management (that's NextAuth in `lib/auth.ts`).

---

## `verification-tokens.ts` — token storage

**Purpose:** Create, read, and purge email verification tokens in the `VerificationToken` table.

### Key exports

| Function                                | Description                                |
| --------------------------------------- | ------------------------------------------ |
| `createEmailVerificationToken(email)`   | Generate token + expiry                    |
| `getPendingEmailVerification(email)`    | Check if unverified user has pending token |
| `removeEmailVerificationTokens(email)`  | Clear tokens after verify                  |
| `purgeExpiredEmailVerificationTokens()` | Cleanup job                                |

### Code demo — register flow

```typescript
// app/api/auth/register/route.ts
import { createEmailVerificationToken } from '@/lib/services/verification-tokens'
import { sendVerificationEmail } from '@/lib/emails/send-verification-email'

const user = await prisma.user.create({ data: { email, passwordHash, role: 'USER' } })
const { token, expires } = await createEmailVerificationToken(email)
await sendVerificationEmail(email, token)
return NextResponse.json({ ok: true, verifyRequired: true })
```

**OAuth conflict:** If the email already belongs to a Google/GitHub-only account, registration returns an error directing the user to sign in with that provider.

---

## `email-verification.ts` — verify + auto-login

**Purpose:** Validate token, mark user verified, issue one-time login token, send welcome email.

### Key exports

| Function                                      | Description                |
| --------------------------------------------- | -------------------------- |
| `verifyEmailAndIssueLoginToken(email, token)` | Full verification workflow |

### Code demo — verify API

```typescript
// app/api/auth/verify-email/route.ts
import { verifyEmailAndIssueLoginToken } from '@/lib/services/email-verification'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const result = await verifyEmailAndIssueLoginToken(email!, token!)
  if (!result.ok) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', origin))
  }

  // result.loginToken → used by /verified page for seamless sign-in
  return NextResponse.redirect(new URL(`/verified?token=${result.loginToken}`, origin))
}
```

### Code demo — internal verification

```typescript
// lib/services/email-verification.ts (simplified)
export async function verifyEmailAndIssueLoginToken(email, token) {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  })
  if (!record || record.expires < new Date()) {
    return { ok: false, reason: 'invalid' }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ])

  await sendWelcomeEmail(email)
  const loginToken = await createOneTimeLoginToken(email)
  return { ok: true, loginToken }
}
```

---

## OAuth providers (NextAuth)

Configured in `lib/auth.ts` and gated by env vars in `lib/auth/providers.ts`.

| Provider | Env vars                                   | Callback URI                          |
| -------- | ------------------------------------------ | ------------------------------------- |
| Google   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `{AUTH_URL}/api/auth/callback/google` |
| GitHub   | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `{AUTH_URL}/api/auth/callback/github` |

Login UI (`LoginForm`) shows OAuth buttons only when the matching env vars are set. Icons: `components/auth/OAuthIcons.tsx`.

### Account linking (one email = one user)

| Scenario                                       | Behavior                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Register with email → later OAuth (same email) | OAuth links to existing `User` via `allowDangerousEmailAccountLinking` + `signIn` callback |
| OAuth first → credentials register             | Blocked at `/api/auth/register`                                                            |
| OAuth first → credentials login                | `POST /api/auth/verification-status` returns provider hint                                 |

Trusted providers: `google`, `github` (`lib/auth/account-linking.ts`).

### Session fields

| Field               | Source                          | Purpose                                |
| ------------------- | ------------------------------- | -------------------------------------- |
| `user.authProvider` | JWT callback                    | Active sign-in method for this session |
| `user.image`        | JWT `picture` / DB `User.image` | Avatar in header and profile           |

Sign out and sign in again after auth changes to refresh `authProvider` and `image`.

---

## Profile avatar API

Credentials sessions only. OAuth users use provider photos (read-only on profile).

| Method | Route              | Description                                  |
| ------ | ------------------ | -------------------------------------------- |
| POST   | `/api/user/avatar` | Upload to Cloudinary `cartpulse/avatars/`    |
| DELETE | `/api/user/avatar` | Remove Cloudinary asset + clear `User.image` |

```typescript
// app/api/user/avatar/route.ts (concept)
import { isAllowedAvatarImage, uploadUserAvatar } from '@/lib/cloudinary'
import { canUploadCustomAvatar } from '@/lib/user-avatar'

if (!canUploadCustomAvatar(session.user.authProvider)) {
  return NextResponse.json({ error: 'Credentials only' }, { status: 403 })
}
// POST: validate MIME (JPG, JPEG, PNG, WebP, SVG), uploadUserAvatar, update User.image
// DELETE: deleteCloudinaryImage, set User.image = null
```

Helpers: `lib/user-avatar.ts`, `lib/cloudinary.ts` (`isAllowedAvatarImage`).

---

## Related auth files (not in `lib/services/`)

| File                            | Role                                             |
| ------------------------------- | ------------------------------------------------ |
| `lib/auth.ts`                   | NextAuth handlers, credentials + OAuth providers |
| `lib/auth.config.ts`            | JWT/session callbacks, `authProvider`            |
| `lib/auth/prisma-adapter.ts`    | OAuth-safe Prisma adapter (`User.image`)         |
| `lib/auth/providers.ts`         | Env-gated Google/GitHub provider list            |
| `lib/auth/account-linking.ts`   | Trusted OAuth providers for email linking        |
| `lib/auth/user-auth-methods.ts` | Resolve linked auth methods for a user           |
| `lib/user-auth-profile.ts`      | Profile/password rules by sign-in method         |
| `lib/auth-access.ts`            | `canAccessAdmin`, `canAccessDashboard`           |
| `lib/admin-auth.ts`             | `requireAdminAction()` for API routes            |
| `proxy.ts`                      | Route-level auth gates                           |

### Code demo — session check in API

```typescript
// lib/auth.ts usage in any protected route
import { requireSessionUser } from '@/lib/auth'

const user = await requireSessionUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Code demo — admin permission guard

```typescript
// app/api/admin/products/[id]/route.ts
import { auth } from '@/lib/auth'
import { requireAdminAction } from '@/lib/admin-auth'

const session = await auth()
const access = requireAdminAction(session, 'update')
if ('error' in access) return access.error
```

### Code demo — OAuth login hint

```typescript
// POST /api/auth/verification-status
// Returns { oauthProvider: 'google' | 'github' } when email exists but has no password
```
