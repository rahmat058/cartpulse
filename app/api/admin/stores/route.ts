import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import { createStore } from '@/lib/services/admin-stores'
import { listStores } from '@/lib/services/stores'
import type { CreateStoreInput } from '@/types/admin'

export async function GET() {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  try {
    const stores = await listStores(false, 'newest')
    return NextResponse.json({ data: stores })
  } catch (error) {
    console.error('Admin stores fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'create')
  if ('error' in access) return access.error

  try {
    const body = (await request.json()) as CreateStoreInput

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const store = await createStore(body)
    logAdminActivity(access.user, 'CREATE', 'STORE', {
      entityId: store.id,
      entityLabel: store.name,
      summary: `Created store "${store.name}"`,
    })
    return NextResponse.json({ data: store }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create store'
    const status = message.includes('required') || message.includes('already exists') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
