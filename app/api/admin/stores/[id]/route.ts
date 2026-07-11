import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import { deleteStore, getAdminStore, updateStore } from '@/lib/services/admin-stores'
import type { UpdateStoreInput } from '@/types/admin'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  const { id } = await context.params
  const store = await getAdminStore(id)
  if (!store) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: store })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'update')
  if ('error' in access) return access.error

  const { id } = await context.params
  const body = (await request.json()) as UpdateStoreInput

  try {
    const store = await updateStore(id, body)
    logAdminActivity(access.user, 'UPDATE', 'STORE', {
      entityId: store.id,
      entityLabel: store.name,
      summary: `Updated store "${store.name}"`,
    })
    return NextResponse.json({ data: store })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update store'
    const status = message.includes('not found') ? 404 : message.includes('already exists') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'delete')
  if ('error' in access) return access.error

  const { id } = await context.params

  try {
    const existing = await getAdminStore(id)
    await deleteStore(id)
    logAdminActivity(access.user, 'DELETE', 'STORE', {
      entityId: id,
      entityLabel: existing?.name,
      summary: `Deleted store "${existing?.name ?? id}"`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete store'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
