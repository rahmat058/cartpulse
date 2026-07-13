import { apiJson, apiJsonPublic } from '@/lib/api/security-headers'
import { listCategoryTree } from '@/lib/services/categories'

export async function GET() {
  try {
    const categories = await listCategoryTree()
    return apiJsonPublic({ data: categories })
  } catch (error) {
    console.error('Category list failed:', error)
    return apiJson({ error: 'Failed to load categories' }, { status: 500 })
  }
}
