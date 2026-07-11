import prisma from '@/lib/prisma'
import { authTokenId, createRawToken, hashAuthToken } from '@/lib/auth-tokens'
import { sendWelcomeEmail } from '@/lib/emails/send-auth-email'
import {
  purgeExpiredEmailVerificationTokens,
  removeEmailVerificationTokens,
} from '@/lib/services/verification-tokens'

export type VerifyEmailResult =
  | { ok: true; email: string; loginToken: string; name: string | null }
  | { ok: false; reason: 'invalid' | 'expired' }

async function issueOneTimeLoginToken(userId: string) {
  const loginToken = createRawToken()
  const hashed = hashAuthToken(loginToken)

  await prisma.verificationToken.deleteMany({
    where: { identifier: authTokenId.oneTimeLogin(userId) },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: authTokenId.oneTimeLogin(userId),
      token: hashed,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  return loginToken
}

export async function verifyEmailAndIssueLoginToken(
  email: string,
  rawToken: string,
): Promise<VerifyEmailResult> {
  await purgeExpiredEmailVerificationTokens(email)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { ok: false, reason: 'invalid' }
  }

  if (user.emailVerified) {
    await removeEmailVerificationTokens(email)
    const loginToken = await issueOneTimeLoginToken(user.id)
    return { ok: true, email, loginToken, name: user.name }
  }

  const hashed = hashAuthToken(rawToken)
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: authTokenId.emailVerify(email),
      token: hashed,
    },
  })

  if (!record) {
    return { ok: false, reason: 'invalid' }
  }

  if (record.expires < new Date()) {
    await removeEmailVerificationTokens(email)
    return { ok: false, reason: 'expired' }
  }

  const loginToken = createRawToken()

  try {
    await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: user.id } })
      if (!freshUser) {
        throw new Error('USER_NOT_FOUND')
      }

      if (freshUser.emailVerified) {
        return
      }

      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      })

      await tx.verificationToken.deleteMany({
        where: { identifier: authTokenId.emailVerify(email) },
      })

      await tx.verificationToken.deleteMany({
        where: { identifier: authTokenId.oneTimeLogin(user.id) },
      })

      await tx.verificationToken.create({
        data: {
          identifier: authTokenId.oneTimeLogin(user.id),
          token: hashAuthToken(loginToken),
          expires: new Date(Date.now() + 10 * 60 * 1000),
        },
      })
    })
  } catch (error) {
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } })
    if (!refreshed?.emailVerified) {
      throw error
    }
    await removeEmailVerificationTokens(email)
  }

  const confirmed = await prisma.user.findUnique({ where: { id: user.id } })
  if (!confirmed?.emailVerified) {
    return { ok: false, reason: 'invalid' }
  }

  await removeEmailVerificationTokens(email)

  const hasLoginToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: authTokenId.oneTimeLogin(user.id),
      token: hashAuthToken(loginToken),
    },
  })

  const tokenForSignIn = hasLoginToken ? loginToken : await issueOneTimeLoginToken(user.id)

  void sendWelcomeEmail({ to: email, name: user.name ?? undefined })

  return { ok: true, email, loginToken: tokenForSignIn, name: user.name }
}
