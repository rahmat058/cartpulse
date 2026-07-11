import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiJson, parseJsonBody } from '@/lib/api'
import { getAuthBaseUrl } from '@/lib/auth-tokens'
import { formatOAuthProviders } from '@/lib/auth/account-linking'
import { sendEmailVerificationEmail } from '@/lib/emails/send-auth-email'
import {
  createEmailVerificationToken,
  getPendingEmailVerification,
  purgeExpiredEmailVerificationTokens,
} from '@/lib/services/verification-tokens'

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody<{
      name?: string
      email?: string
      password?: string
    }>(request)

    if ('error' in parsed) return parsed.error

    const body = parsed.data
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!name || !email || !password) {
      return apiJson({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return apiJson({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    await purgeExpiredEmailVerificationTokens()

    const existing = await prisma.user.findUnique({
      where: { email },
      include: { accounts: { select: { provider: true } } },
    })

    if (existing?.emailVerified) {
      const oauthProviders = existing.accounts.map((account) => account.provider)
      if (!existing.passwordHash && oauthProviders.length > 0) {
        return NextResponse.json(
          {
            error: `This email is already registered with ${formatOAuthProviders(oauthProviders)}. Sign in with that provider instead.`,
          },
          { status: 409 },
        )
      }

      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    if (existing && !existing.emailVerified) {
      await prisma.user.update({
        where: { email },
        data: { name, passwordHash },
      })

      const { rawToken } = await createEmailVerificationToken(email)
      const verifyUrl = `${getAuthBaseUrl()}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`
      await sendEmailVerificationEmail({ to: email, name, verifyUrl })

      return NextResponse.json({
        ok: true,
        requiresVerification: true,
        resent: true,
        message: 'A new verification email has been sent.',
      })
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
      },
    })

    const { rawToken } = await createEmailVerificationToken(email)
    const verifyUrl = `${getAuthBaseUrl()}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`
    await sendEmailVerificationEmail({ to: email, name, verifyUrl })

    return NextResponse.json({ ok: true, requiresVerification: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

/** Check if an email has a pending (unverified) account — used by register page. */
export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const pending = await getPendingEmailVerification(email)

  return NextResponse.json({
    pending: pending.pending,
    hasActiveToken: pending.hasActiveToken,
    tokenExpiresAt: pending.tokenExpiresAt?.toISOString() ?? null,
  })
}
