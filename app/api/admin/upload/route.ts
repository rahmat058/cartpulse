import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdminAction } from '@/lib/admin-auth'
import {
  deleteCloudinaryImage,
  isAllowedProductImage,
  isCloudinaryConfigured,
  uploadProductImage,
} from '@/lib/cloudinary'

export async function POST(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'create')
  if ('error' in access) return access.error

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary is not configured. Set CLOUDINARY_* env vars.' }, { status: 503 })
  }

  const formData = await request.formData()
  const files = [...formData.getAll('file'), ...formData.getAll('files')].filter(
    (entry): entry is File => entry instanceof File,
  )

  if (files.length === 0) {
    return NextResponse.json({ error: 'At least one image file is required' }, { status: 400 })
  }

  const invalid = files.find((file) => !isAllowedProductImage(file))
  if (invalid) {
    return NextResponse.json(
      { error: 'Only PNG, JPEG, JPG, and WebP images are allowed' },
      { status: 400 },
    )
  }

  try {
    const uploads = await Promise.all(files.map((file) => uploadProductImage(file)))
    return NextResponse.json({ data: uploads })
  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message.includes('Cloudinary rejected') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  const access = requireAdminAction(session, 'delete')
  if ('error' in access) return access.error

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary is not configured. Set CLOUDINARY_* env vars.' }, { status: 503 })
  }

  const body = (await request.json()) as { url?: string }
  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  try {
    await deleteCloudinaryImage(body.url)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cloudinary delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
