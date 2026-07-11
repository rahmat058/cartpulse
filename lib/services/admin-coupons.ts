import prisma from '@/lib/prisma'
import { NOT_DELETED, softDeleteCouponById } from '@/lib/services/soft-delete'
import type { CouponType } from '@/app/generated/prisma/client'
import type {
  AdminCouponDetail,
  CreateCouponInput,
  UpdateCouponInput,
} from '@/types/admin'

export interface AdminCouponRow {
  id: string
  code: string
  type: CouponType
  value: number
  label: string
  active: boolean
  minSubtotal: number | null
  maxUses: number | null
  usedCount: number
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

function parseOptionalDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value')
  }
  return date
}

function mapCoupon(row: {
  id: string
  code: string
  type: CouponType
  value: number
  label: string
  active: boolean
  minSubtotal: number | null
  maxUses: number | null
  usedCount: number
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
}): AdminCouponRow {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    label: row.label,
    active: row.active,
    minSubtotal: row.minSubtotal,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listAdminCoupons(): Promise<AdminCouponRow[]> {
  const rows = await prisma.coupon.findMany({
    where: NOT_DELETED,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapCoupon)
}

export async function getAdminCoupon(id: string): Promise<AdminCouponDetail | null> {
  const row = await prisma.coupon.findFirst({ where: { id, ...NOT_DELETED } })
  return row ? mapCoupon(row) : null
}

export async function createAdminCoupon(input: CreateCouponInput): Promise<AdminCouponRow> {
  const code = normalizeCode(input.code)
  if (!code) {
    throw new Error('Promo code is required')
  }

  const existing = await prisma.coupon.findFirst({ where: { code, ...NOT_DELETED } })
  if (existing) {
    throw new Error('A promo code with this code already exists')
  }

  const row = await prisma.coupon.create({
    data: {
      code,
      type: input.type,
      value: input.value,
      label: input.label.trim(),
      active: input.active ?? true,
      minSubtotal: input.minSubtotal ?? null,
      maxUses: input.maxUses ?? null,
      startsAt: parseOptionalDate(input.startsAt) ?? null,
      endsAt: parseOptionalDate(input.endsAt) ?? null,
    },
  })

  return mapCoupon(row)
}

export async function updateAdminCoupon(
  id: string,
  data: UpdateCouponInput & { activeOnly?: boolean },
): Promise<AdminCouponRow> {
  const existing = await prisma.coupon.findFirst({ where: { id, ...NOT_DELETED } })
  if (!existing) {
    throw new Error('Promo code not found')
  }

  if (data.activeOnly) {
    const row = await prisma.coupon.update({
      where: { id },
      data: { active: data.active },
    })
    return mapCoupon(row)
  }

  if (data.code) {
    const code = normalizeCode(data.code)
    const conflict = await prisma.coupon.findFirst({
      where: { code, ...NOT_DELETED, NOT: { id } },
    })
    if (conflict) {
      throw new Error('A promo code with this code already exists')
    }
  }

  const row = await prisma.coupon.update({
    where: { id },
    data: {
      code: data.code ? normalizeCode(data.code) : undefined,
      type: data.type,
      value: data.value,
      label: data.label?.trim(),
      active: data.active,
      minSubtotal: data.minSubtotal === undefined ? undefined : data.minSubtotal,
      maxUses: data.maxUses === undefined ? undefined : data.maxUses,
      startsAt: parseOptionalDate(data.startsAt),
      endsAt: parseOptionalDate(data.endsAt),
    },
  })

  return mapCoupon(row)
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  await softDeleteCouponById(id)
}
