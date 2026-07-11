import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import { createAdminCoupon, listAdminCoupons } from '@/lib/services/admin-coupons'
import type { CreateCouponInput } from '@/types/admin'

export async function GET() {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  try {
    const coupons = await listAdminCoupons()
    return NextResponse.json({ data: coupons })
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
