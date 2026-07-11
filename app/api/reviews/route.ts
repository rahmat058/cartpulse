import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createProductReview, listProductReviews, listUserReviews } from '@/lib/services/reviews'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (productId) {
    const reviews = await listProductReviews(productId)
    return NextResponse.json({ data: reviews })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reviews = await listUserReviews(session.user.id)
  return NextResponse.json({ data: reviews })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as {
      productId?: string
      rating?: number
      body?: string
    }

    if (!body.productId || !body.rating) {
      return NextResponse.json({ error: 'productId and rating are required' }, { status: 400 })
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
    }

    const review = await createProductReview(session.user.id, {
      productId: body.productId,
      rating: body.rating,
      body: body.body,
    })

    const withProduct = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        product: { select: { name: true, emoji: true, slug: true, imageUrl: true, imageUrls: true } },
      },
    })

    return NextResponse.json({ data: { ...review, product: withProduct?.product ?? null } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create review'
    const status = message.includes('already reviewed') ? 409 : 500
    if (status === 500) {
      console.error('Review error:', error)
    }
    return NextResponse.json({ error: message }, { status })
  }
}
