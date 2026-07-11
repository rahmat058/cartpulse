import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markNotificationRead } from '@/lib/services/notifications'

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    await markNotificationRead(session.user.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notification'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
