import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import { parsePageSearchParams } from '@/lib/api/pagination'
import { createAdminCoupon, listAdminCoupons } from '@/lib/services/admin-coupons'
import type { CreateCouponInput } from '@/types/admin'

export async function GET(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  try {
    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePageSearchParams(searchParams)
    const search = searchParams.get('search')?.trim() || undefined
    const statusParam = searchParams.get('status')
    const status =
      statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all'

    const result = await listAdminCoupons({ search, status, page, pageSize })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin coupons fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'create')
  if ('error' in access) return access.error

  try {
    const body = (await request.json()) as CreateCouponInput

    if (!body.code?.trim() || !body.label?.trim()) {
      return NextResponse.json({ error: 'code and label are required' }, { status: 400 })
    }

    const coupon = await createAdminCoupon(body)
    logAdminActivity(access.user, 'CREATE', 'COUPON', {
      entityId: coupon.id,
      entityLabel: coupon.code,
      summary: `Created promo code "${coupon.code}"`,
    })
    return NextResponse.json({ data: coupon }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create promo code'
    const status =
      message.includes('required') || message.includes('already exists') || message.includes('Invalid')
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
