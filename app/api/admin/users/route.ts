import { listUsers } from '@/lib/services/orders'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireSuperAdminSession } from '@/lib/admin-auth'
import { parsePageSearchParams } from '@/lib/api/pagination'
import type { AppRole } from '@/types/auth'

export async function GET(request: Request) {
  const session = await auth()
  const access = requireSuperAdminSession(session)
  if ('error' in access) return access.error

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') as AppRole | null
  const search = searchParams.get('search')?.trim() || undefined
  const { page, pageSize } = parsePageSearchParams(searchParams)

  const result = await listUsers({
    role: role ?? undefined,
    search,
    page,
    pageSize,
  })
  return NextResponse.json(result)
}
