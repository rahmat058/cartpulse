import { NextResponse } from 'next/server'
import { getActiveCouponByCode, listActiveCoupons } from '@/lib/services/coupons'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      const coupon = await getActiveCouponByCode(code)
      if (!coupon) {
        return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 })
      }
      return NextResponse.json({ data: coupon })
    }

    const coupons = await listActiveCoupons()
    return NextResponse.json({ data: coupons })
  } catch (error) {
    console.error('Coupon fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string; subtotal?: number }
    const code = body.code?.trim()
    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    const coupon = await getActiveCouponByCode(code)
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 })
    }

    if (coupon.minSubtotal != null && (body.subtotal ?? 0) < coupon.minSubtotal) {
      return NextResponse.json(
        { error: `Minimum subtotal of $${coupon.minSubtotal.toFixed(2)} required` },
        { status: 400 },
      )
    }

    return NextResponse.json({ data: coupon })
  } catch (error) {
    console.error('Coupon validate failed:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
