import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import {
  createAdminCategory,
  listAdminCategories,
  listAdminCategoryParents,
  listAdminCategoryTree,
} from '@/lib/services/admin-categories'
import type { CreateCategoryInput } from '@/types/admin'

export async function GET(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  const { searchParams } = new URL(request.url)
  if (searchParams.get('tree') === 'true') {
    const tree = await listAdminCategoryTree()
    return NextResponse.json({ data: tree })
  }

  if (searchParams.get('parents') === 'true') {
    const excludeId = searchParams.get('excludeId') ?? undefined
    const parents = await listAdminCategoryParents(excludeId)
    return NextResponse.json({ data: parents })
  }

  try {
    const categories = await listAdminCategories()
    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('Admin categories fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'create')
  if ('error' in access) return access.error

  try {
    const body = (await request.json()) as CreateCategoryInput
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const category = await createAdminCategory(body)
    logAdminActivity(access.user, 'CREATE', 'CATEGORY', {
      entityId: category.id,
      entityLabel: category.name,
      summary: `Created category "${category.name}"`,
    })
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create category'
    const status = message.includes('required') || message.includes('already exists') || message.includes('parent') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
