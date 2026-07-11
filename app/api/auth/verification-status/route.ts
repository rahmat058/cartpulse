import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string }
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json({ needsVerification: false })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { select: { provider: true } } },
  })

  if (!user) {
    return NextResponse.json({ needsVerification: false })
  }

  if (!user.passwordHash) {
    const oauthProvider = user.accounts[0]?.provider ?? null
    return NextResponse.json({
      needsVerification: false,
      oauthProvider,
    })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ needsVerification: false })
  }

  return NextResponse.json({ needsVerification: !user.emailVerified })
}
