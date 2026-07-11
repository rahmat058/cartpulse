import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  deleteCloudinaryImage,
  isAllowedAvatarImage,
  isCloudinaryConfigured,
  isCloudinaryUrl,
  uploadUserAvatar,
} from '@/lib/cloudinary'
import { canUploadCustomAvatar } from '@/lib/user-avatar'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!canUploadCustomAvatar(session.user.authProvider)) {
    return NextResponse.json(
      { error: 'Avatar upload is only available for email and password accounts.' },
      { status: 403 },
    )
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary is not configured. Set CLOUDINARY_* env vars.' }, { status: 503 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'An image file is required' }, { status: 400 })
  }

  if (!isAllowedAvatarImage(file)) {
    return NextResponse.json({ error: 'Only JPG, JPEG, PNG, WebP, and SVG images are allowed' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const upload = await uploadUserAvatar(file)

    if (user.image && isCloudinaryUrl(user.image)) {
      await deleteCloudinaryImage(user.image).catch(() => undefined)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: upload.url },
    })

    return NextResponse.json({ data: { url: upload.url } })
  } catch (error) {
    console.error('Avatar upload failed:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message.includes('Cloudinary rejected') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!canUploadCustomAvatar(session.user.authProvider)) {
    return NextResponse.json(
      { error: 'Avatar changes are only available for email and password accounts.' },
      { status: 403 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.image && isCloudinaryUrl(user.image)) {
    await deleteCloudinaryImage(user.image).catch(() => undefined)
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  })

  return NextResponse.json({ success: true })
}
