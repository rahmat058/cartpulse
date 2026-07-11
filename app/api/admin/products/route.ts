import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import { createProduct, listAdminProducts } from '@/lib/services/admin-products'
import type { CreateProductInput } from '@/types/admin'

export async function GET(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId') ?? undefined
    const categorySlug = searchParams.get('categorySlug') ?? undefined
    const publishedParam = searchParams.get('published')
    const published = publishedParam === 'true' ? true : publishedParam === 'false' ? false : undefined
    const search = searchParams.get('search') ?? undefined
    const sort = (searchParams.get('sort') as 'name' | 'price' | 'stock' | 'newest' | null) ?? 'newest'
    const page = Number(searchParams.get('page') ?? '1')
    const pageSize = Number(searchParams.get('pageSize') ?? '20')

    const result = await listAdminProducts({
      storeId,
      categorySlug,
      published,
      search,
      sort,
      page,
      pageSize,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching admin products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'create')
  if ('error' in access) return access.error

  try {
    const body = (await request.json()) as CreateProductInput

    if (!body.storeId?.trim()) {
      return NextResponse.json(
        { error: 'storeId is required — select a store before uploading a product' },
        { status: 400 },
      )
    }

    if (!body.name?.trim() || !body.categorySlug?.trim()) {
      return NextResponse.json({ error: 'name and categorySlug are required' }, { status: 400 })
    }

    const product = await createProduct(body)
    logAdminActivity(access.user, 'CREATE', 'PRODUCT', {
      entityId: product.id,
      entityLabel: product.name,
      summary: `Created product "${product.name}"`,
    })
    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    const message = error instanceof Error ? error.message : 'Failed to create product'
    const status =
      message.includes('required') || message.includes('not found') || message.includes('already exists') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
