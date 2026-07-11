import prisma from '@/lib/prisma'
import { authTokenId, createRawToken, hashAuthToken } from '@/lib/auth-tokens'

/** Email verification links expire after 24 hours. */
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000

export function getEmailVerifyExpiresAt(from = Date.now()) {
  return new Date(from + EMAIL_VERIFY_TTL_MS)
}

/** Remove expired email-verify tokens (optionally scoped to one email). */
export async function purgeExpiredEmailVerificationTokens(email?: string) {
  await prisma.verificationToken.deleteMany({
    where: {
      ...(email ? { identifier: authTokenId.emailVerify(email) } : { identifier: { startsWith: 'email-verify:' } }),
      expires: { lt: new Date() },
    },
  })
}

/** Remove all email-verify tokens for an address (after successful verify or before re-issue). */
export async function removeEmailVerificationTokens(email: string) {
  await prisma.verificationToken.deleteMany({
    where: { identifier: authTokenId.emailVerify(email) },
  })
}

/** Create a fresh 24h verification token; replaces any existing tokens for this email. */
export async function createEmailVerificationToken(email: string) {
  await purgeExpiredEmailVerificationTokens(email)
  await removeEmailVerificationTokens(email)

  const rawToken = createRawToken()
  const expires = getEmailVerifyExpiresAt()

  await prisma.verificationToken.create({
    data: {
      identifier: authTokenId.emailVerify(email),
      token: hashAuthToken(rawToken),
      expires,
    },
  })

  return { rawToken, expires }
}

export async function getPendingEmailVerification(email: string) {
  await purgeExpiredEmailVerificationTokens(email)

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true, name: true },
  })

  if (!user || user.emailVerified) {
    return { pending: false as const, user: null, tokenExpiresAt: null }
  }

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: authTokenId.emailVerify(email) },
    orderBy: { expires: 'desc' },
    select: { expires: true },
  })

  return {
    pending: true as const,
    user,
    tokenExpiresAt: token?.expires ?? null,
    hasActiveToken: Boolean(token && token.expires > new Date()),
  }
}
