import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import type { CouponDefinition } from '@/types/commerce'

export async function getActiveCouponByCode(code: string): Promise<CouponDefinition | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const coupon = await prisma.coupon.findFirst({
    where: { code: normalized, ...NOT_DELETED },
  })
  if (!coupon || !coupon.active) return null

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) return null
  if (coupon.endsAt && coupon.endsAt < now) return null
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return null

  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    label: coupon.label,
    minSubtotal: coupon.minSubtotal,
  }
}

export async function listActiveCoupons(): Promise<CouponDefinition[]> {
  const now = new Date()
  const rows = await prisma.coupon.findMany({
    where: {
      ...NOT_DELETED,
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    },
    orderBy: { code: 'asc' },
  })

  return rows
    .filter((row) => {
      if (row.endsAt && row.endsAt < now) return false
      if (row.maxUses != null && row.usedCount >= row.maxUses) return false
      return true
    })
    .map((coupon) => ({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      label: coupon.label,
      minSubtotal: coupon.minSubtotal,
    }))
}

export async function incrementCouponUsage(code: string) {
  await prisma.coupon.updateMany({
    where: { code: code.trim().toUpperCase(), active: true, ...NOT_DELETED },
    data: { usedCount: { increment: 1 } },
  })
}

/** Increment DB usage once when a promo code was applied to a completed order. */
export async function recordCouponUsage(promoCode: string | null | undefined, discount: number) {
  if (!promoCode?.trim() || discount <= 0) return
  await incrementCouponUsage(promoCode)
}
