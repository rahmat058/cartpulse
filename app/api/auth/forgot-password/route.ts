import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/emails/send-auth-email'
import { authTokenId, createRawToken, getAuthBaseUrl, hashAuthToken } from '@/lib/auth-tokens'

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string }
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always succeed to avoid email enumeration
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: true })
  }

  const rawToken = createRawToken()
  const token = hashAuthToken(rawToken)
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.verificationToken.deleteMany({
    where: { identifier: authTokenId.passwordReset(email) },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: authTokenId.passwordReset(email),
      token,
      expires,
    },
  })

  const baseUrl = getAuthBaseUrl()
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

  await sendPasswordResetEmail({ to: email, resetUrl, name: user.name ?? undefined })

  return NextResponse.json({ ok: true })
}
