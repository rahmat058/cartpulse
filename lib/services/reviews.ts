import prisma from '@/lib/prisma'

export type ProductReviewItem = {
  id: string
  userId: string
  rating: number
  body: string | null
  createdAt: string
  author: string
}

function displayAuthor(name: string | null, email: string | null): string {
  if (name?.trim()) return name.trim()
  if (email) return email.split('@')[0] ?? 'Customer'
  return 'Customer'
}

export async function listProductReviews(productId: string): Promise<ProductReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reviews.map((review) => ({
    id: review.id,
    userId: review.userId,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    author: displayAuthor(review.user.name, review.user.email),
  }))
}

async function syncProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  })

  if (aggregate._count === 0) return

  await prisma.product.update({
    where: { id: productId },
    data: { rating: aggregate._avg.rating ?? 0 },
  })
}

export async function createProductReview(
  userId: string,
  input: { productId: string; rating: number; body?: string },
) {
  const existing = await prisma.review.findFirst({
    where: { userId, productId: input.productId },
  })

  if (existing) {
    throw new Error('You have already reviewed this product')
  }

  const product = await prisma.product.findFirst({
    where: { id: input.productId, published: true },
    select: { id: true },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId: input.productId,
      rating: input.rating,
      body: input.body?.trim() || null,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  await syncProductRating(input.productId)

  return {
    id: review.id,
    userId: review.userId,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    author: displayAuthor(review.user.name, review.user.email),
  } satisfies ProductReviewItem
}

export async function listUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  })
}
