import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listWishlist, listWishlistProductIds, toggleWishlistItem } from '@/lib/services/wishlist'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [items, productIds] = await Promise.all([
    listWishlist(session.user.id),
    listWishlistProductIds(session.user.id),
  ])

  return NextResponse.json({ data: items, productIds })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { productId?: string; ensure?: boolean }
  if (!body.productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  try {
    if (body.ensure) {
      const { addWishlistItem } = await import('@/lib/services/wishlist')
      await addWishlistItem(session.user.id, body.productId)
      const productIds = await listWishlistProductIds(session.user.id)
      return NextResponse.json({ wished: true as const, productIds })
    }

    const result = await toggleWishlistItem(session.user.id, body.productId)
    const productIds = await listWishlistProductIds(session.user.id)
    return NextResponse.json({ ...result, productIds })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update wishlist'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const { removeWishlistItem } = await import('@/lib/services/wishlist')
  await removeWishlistItem(session.user.id, productId)
  const productIds = await listWishlistProductIds(session.user.id)
  return NextResponse.json({ productIds })
}
