import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import {
  deleteAdminCategory,
  getAdminCategory,
  updateAdminCategory,
} from '@/lib/services/admin-categories'
import type { UpdateCategoryInput } from '@/types/admin'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  const { id } = await context.params
  const category = await getAdminCategory(id)
  if (!category) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: category })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'update')
  if ('error' in access) return access.error

  const { id } = await context.params
  const body = (await request.json()) as UpdateCategoryInput

  try {
    const category = await updateAdminCategory(id, body)
    logAdminActivity(access.user, 'UPDATE', 'CATEGORY', {
      entityId: category.id,
      entityLabel: category.name,
      summary: `Updated category "${category.name}"`,
    })
    return NextResponse.json({ data: category })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update category'
    const status = message.includes('not found') ? 404 : message.includes('already exists') || message.includes('parent') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'delete')
  if ('error' in access) return access.error

  const { id } = await context.params

  try {
    const existing = await getAdminCategory(id)
    await deleteAdminCategory(id)
    logAdminActivity(access.user, 'DELETE', 'CATEGORY', {
      entityId: id,
      entityLabel: existing?.name,
      summary: `Deleted category "${existing?.name ?? id}"`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete category'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
