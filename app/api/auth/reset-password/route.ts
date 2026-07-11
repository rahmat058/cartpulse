import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { sendPasswordChangedEmail } from '@/lib/emails/send-auth-email'
import { authTokenId, hashAuthToken } from '@/lib/auth-tokens'

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string
    token?: string
    password?: string
  }

  const email = body.email?.trim().toLowerCase()
  const token = body.token?.trim()
  const password = body.password

  if (!email || !token || !password) {
    return NextResponse.json({ error: 'email, token, and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: authTokenId.passwordReset(email),
        token: hashAuthToken(token),
      },
    },
  })

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ])

  await sendPasswordChangedEmail({ to: email, name: user.name ?? undefined })

  return NextResponse.json({ ok: true })
}
