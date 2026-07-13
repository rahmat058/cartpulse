import { auth } from '@/lib/auth'
import { requireAdminAction } from '@/lib/admin-auth'
import { apiJson, apiJsonPublic } from '@/lib/api/security-headers'
import { createProduct } from '@/lib/services/admin-products'
import { getProducts, parseCatalogQueryParams } from '@/lib/services/products'
import type { CreateProductInput } from '@/types/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const { getProductsByIds } = await import('@/lib/services/products')
      const ids = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
      const data = await getProductsByIds(ids)
      return apiJsonPublic({ data })
    }

    const query = parseCatalogQueryParams(searchParams)
    const products = await getProducts(query)
    return apiJsonPublic(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return apiJson(
      { error: 'Failed to fetch products. Ensure DATABASE_URL is set and run db:push && db:seed.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'create')
  if ('error' in access) return access.error

  try {
    const body = (await request.json()) as CreateProductInput
    const product = await createProduct(body)
    return apiJson({ data: product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    return apiJson({ error: message }, { status: 400 })
  }
}
