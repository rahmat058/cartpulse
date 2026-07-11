import { listUsers } from '@/lib/services/orders'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireSuperAdminSession } from '@/lib/admin-auth'
import type { AppRole } from '@/types/auth'

export async function GET(request: Request) {
  const session = await auth()
  const access = requireSuperAdminSession(session)
  if ('error' in access) return access.error

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') as AppRole | null
  const users = await listUsers(role ?? undefined)
  return NextResponse.json({ data: users })
}
