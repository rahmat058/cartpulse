import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthBaseUrl } from '@/lib/auth-tokens'
import { sendEmailVerificationEmail } from '@/lib/emails/send-auth-email'
import {
  createEmailVerificationToken,
  purgeExpiredEmailVerificationTokens,
} from '@/lib/services/verification-tokens'

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string }
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  await purgeExpiredEmailVerificationTokens(email)

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user?.passwordHash || user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  const { rawToken } = await createEmailVerificationToken(email)
  const verifyUrl = `${getAuthBaseUrl()}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`
  await sendEmailVerificationEmail({ to: email, name: user.name ?? undefined, verifyUrl })

  return NextResponse.json({ ok: true })
}
