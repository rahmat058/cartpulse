import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import { deleteAdminCoupon, getAdminCoupon, updateAdminCoupon } from '@/lib/services/admin-coupons'
import type { UpdateCouponInput } from '@/types/admin'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  const { id } = await params
  const coupon = await getAdminCoupon(id)
  if (!coupon) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: coupon })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const access = requireAdminAction(session, 'update')
  if ('error' in access) return access.error

  try {
    const { id } = await params
    const body = (await request.json()) as UpdateCouponInput & { activeOnly?: boolean }
    const coupon = await updateAdminCoupon(id, body)
    logAdminActivity(access.user, body.activeOnly ? 'STATUS_CHANGE' : 'UPDATE', 'COUPON', {
      entityId: coupon.id,
      entityLabel: coupon.code,
      summary: body.activeOnly
        ? `${coupon.active ? 'Activated' : 'Deactivated'} promo code "${coupon.code}"`
        : `Updated promo code "${coupon.code}"`,
      metadata: body.activeOnly ? { active: coupon.active } : undefined,
    })
    return NextResponse.json({ data: coupon })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update promo code'
    const status = message.includes('not found') ? 404 : message.includes('already exists') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'delete')
  if ('error' in access) return access.error

  try {
    const { id } = await params
    const existing = await getAdminCoupon(id)
    await deleteAdminCoupon(id)
    logAdminActivity(access.user, 'DELETE', 'COUPON', {
      entityId: id,
      entityLabel: existing?.code,
      summary: `Deleted promo code "${existing?.code ?? id}"`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete promo code'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
