import { NextResponse } from 'next/server'
import { getAuthBaseUrl } from '@/lib/auth-tokens'
import { verifyEmailAndIssueLoginToken } from '@/lib/services/email-verification'

/** Legacy email links — forward to the verify-email page. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.trim()
  const token = searchParams.get('token')?.trim()
  const baseUrl = getAuthBaseUrl()

  const page = new URL('/verify-email', baseUrl)
  if (email) page.searchParams.set('email', email)
  if (token) page.searchParams.set('token', token)
  if (!email || !token) page.searchParams.set('error', 'invalid')

  return NextResponse.redirect(page.toString())
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; token?: string }
    const email = body.email?.trim().toLowerCase()
    const token = body.token?.trim()

    if (!email || !token) {
      return NextResponse.json({ error: 'Invalid verification link', reason: 'invalid' }, { status: 400 })
    }

    const result = await verifyEmailAndIssueLoginToken(email, token)

    if (!result.ok) {
      const message =
        result.reason === 'expired'
          ? 'Verification link expired'
          : 'Invalid verification link'
      return NextResponse.json({ error: message, reason: result.reason }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      email: result.email,
      loginToken: result.loginToken,
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
