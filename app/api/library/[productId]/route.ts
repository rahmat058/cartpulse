import { NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth'
import { getLibraryDownloadTarget } from '@/lib/services/library'

export async function GET(_request: Request, context: { params: Promise<{ productId: string }> }) {
  const user = await requireSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId } = await context.params
  const target = await getLibraryDownloadTarget(user.id, productId)

  if (!target) {
    return NextResponse.json({ error: 'You do not own this item' }, { status: 404 })
  }

  if (!target.url) {
    return NextResponse.json(
      { error: 'Download is not available yet. Contact support if this persists.' },
      { status: 503 },
    )
  }

  return NextResponse.redirect(target.url)
}
