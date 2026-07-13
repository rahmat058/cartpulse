import { apiJson, apiJsonPublic } from '@/lib/api/security-headers'
import { getProductBySlug } from '@/lib/services/products'

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const product = await getProductBySlug(slug)

    if (!product) {
      return apiJson({ error: 'Product not found' }, { status: 404 })
    }

    return apiJsonPublic({
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
    return apiJson({ error: 'Failed to fetch product' }, { status: 500 })
  }
}
