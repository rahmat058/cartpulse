import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { requireAdminAction } from '@/lib/admin-auth'
import type { UpdateProductInput } from '@/types/admin'
import { deleteProduct, getAdminProduct, setProductPublished, updateProduct } from '@/lib/services/admin-products'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'read')
  if ('error' in access) return access.error

  const { id } = await context.params
  const product = await getAdminProduct(id)
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: product })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'update')
  if ('error' in access) return access.error

  const { id } = await context.params
  const body = (await request.json()) as UpdateProductInput & { publishedOnly?: boolean }

  try {
    if (body.publishedOnly && typeof body.published === 'boolean') {
      const product = await setProductPublished(id, body.published)
      logAdminActivity(access.user, 'STATUS_CHANGE', 'PRODUCT', {
        entityId: product.id,
        entityLabel: product.name,
        summary: `${body.published ? 'Published' : 'Unpublished'} product "${product.name}"`,
        metadata: { published: body.published },
      })
      return NextResponse.json({ data: product })
    }

    const product = await updateProduct(id, body)
    logAdminActivity(access.user, 'UPDATE', 'PRODUCT', {
      entityId: product.id,
      entityLabel: product.name,
      summary: `Updated product "${product.name}"`,
    })
    return NextResponse.json({ data: product })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'delete')
  if ('error' in access) return access.error

  const { id } = await context.params

  try {
    const existing = await getAdminProduct(id)
    await deleteProduct(id)
    logAdminActivity(access.user, 'DELETE', 'PRODUCT', {
      entityId: id,
      entityLabel: existing?.name,
      summary: `Deleted product "${existing?.name ?? id}"`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
