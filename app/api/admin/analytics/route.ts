import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireSuperAdminSession } from '@/lib/admin-auth'
import { getAnalytics } from '@/lib/services/orders'

export async function GET(request: Request) {
  const session = await auth()
  const access = requireSuperAdminSession(session)
  if ('error' in access) return access.error

  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get('days') ?? 30)
  const data = await getAnalytics(Number.isFinite(days) ? days : 30)
  return NextResponse.json({ data })
}
