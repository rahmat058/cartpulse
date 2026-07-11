import { NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/services/products'

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const product = await getProductBySlug(slug)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      meta: {
        schemaVersion: '1.1.0',
        collection: 'product',
        totalProducts: 1,
        categories: [product.category],
        currency: 'USD',
        generatedAt: new Date().toISOString(),
      },
      data: [product],
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}
