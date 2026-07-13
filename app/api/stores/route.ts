import { apiJson, apiJsonPublic } from '@/lib/api/security-headers'
import { listStores } from '@/lib/services/stores'

export async function GET() {
  try {
    const stores = await listStores(true)
    return apiJsonPublic({ data: stores })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return apiJson({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}
