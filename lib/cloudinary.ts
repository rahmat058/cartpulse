import { v2 as cloudinary } from 'cloudinary'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ALLOWED_AVATAR_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg'])

function getProductFolder(): string {
  return process.env.CLOUDINARY_FOLDER?.trim() || 'cartpulse'
}

function getAvatarFolder(): string {
  return `${getProductFolder()}/avatars`
}

function readCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim()
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const api_key = process.env.CLOUDINARY_API_KEY?.trim()
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim()

  return { cloudinaryUrl, cloud_name, api_key, api_secret }
}

export function isCloudinaryConfigured(): boolean {
  const { cloudinaryUrl, cloud_name, api_key, api_secret } = readCloudinaryConfig()
  return Boolean(cloudinaryUrl || (cloud_name && api_key && api_secret))
}

export function isAllowedProductImage(file: File): boolean {
  return isAllowedFile(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)
}

export function isAllowedAvatarImage(file: File): boolean {
  return isAllowedFile(file, ALLOWED_AVATAR_TYPES, ALLOWED_AVATAR_EXTENSIONS)
}

function isAllowedFile(file: File, types: Set<string>, extensions: Set<string>): boolean {
  if (types.has(file.type)) return true
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? extensions.has(extension) : false
}

export function getCloudinary() {
  const { cloudinaryUrl, cloud_name, api_key, api_secret } = readCloudinaryConfig()

  if (cloudinaryUrl) {
    cloudinary.config({ secure: true })
    return cloudinary
  }

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Cloudinary is not configured')
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  })

  return cloudinary
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com')
}

export function extractPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null

  const uploadMarker = '/upload/'
  const uploadIndex = url.indexOf(uploadMarker)
  if (uploadIndex === -1) return null

  let path = url.slice(uploadIndex + uploadMarker.length).split('?')[0]
  path = path.replace(/^v\d+\//, '')
  path = decodeURIComponent(path)
  return path.replace(/\.(png|jpe?g|webp|gif|svg)$/i, '')
}

function formatCloudinaryError(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as {
      message?: string
      http_code?: number
      error?: { message?: string }
    }

    const detail = record.error?.message || record.message

    if (record.http_code === 401 || record.http_code === 403) {
      return [
        'Cloudinary rejected the upload (invalid credentials).',
        'Copy the full API environment variable from Cloudinary → Settings → API Keys,',
        'paste it as CLOUDINARY_URL in .env, restart yarn dev, then try again.',
        detail ? `Cloudinary says: ${detail}` : null,
      ]
        .filter(Boolean)
        .join(' ')
    }

    if (detail) return detail
  }

  return error instanceof Error ? error.message : 'Upload failed'
}

function resolveMimeType(file: File): string {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  return 'image/jpeg'
}

function resolveAvatarMimeType(file: File): string {
  if (ALLOWED_AVATAR_TYPES.has(file.type)) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'svg') return 'image/svg+xml'
  return 'image/jpeg'
}

export async function uploadProductImage(file: File): Promise<{ url: string; publicId: string }> {
  return uploadImageToFolder(file, getProductFolder())
}

export async function uploadUserAvatar(file: File): Promise<{ url: string; publicId: string }> {
  if (!isAllowedAvatarImage(file)) {
    throw new Error('Only JPG, JPEG, PNG, WebP, and SVG images are allowed')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const cloud = getCloudinary()
  const mimeType = resolveAvatarMimeType(file)

  try {
    const result = await cloud.uploader.upload(`data:${mimeType};base64,${buffer.toString('base64')}`, {
      folder: getAvatarFolder(),
      resource_type: 'image',
    })

    if (!result.secure_url || !result.public_id) {
      throw new Error('Upload failed')
    }

    return { url: result.secure_url, publicId: result.public_id }
  } catch (error) {
    throw new Error(formatCloudinaryError(error))
  }
}

async function uploadImageToFolder(file: File, folder: string): Promise<{ url: string; publicId: string }> {
  if (!isAllowedProductImage(file)) {
    throw new Error('Only PNG, JPEG, JPG, and WebP images are allowed')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const cloud = getCloudinary()
  const mimeType = resolveMimeType(file)

  try {
    const result = await cloud.uploader.upload(`data:${mimeType};base64,${buffer.toString('base64')}`, {
      folder,
      resource_type: 'image',
    })

    if (!result.secure_url || !result.public_id) {
      throw new Error('Upload failed')
    }

    return { url: result.secure_url, publicId: result.public_id }
  } catch (error) {
    throw new Error(formatCloudinaryError(error))
  }
}

export async function deleteCloudinaryImage(url: string): Promise<void> {
  const publicId = extractPublicIdFromUrl(url)
  if (!publicId) return

  const cloud = getCloudinary()
  await cloud.uploader.destroy(publicId, { resource_type: 'image' })
}

export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  const uniqueUrls = [...new Set(urls.filter(isCloudinaryUrl))]
  await Promise.allSettled(uniqueUrls.map((url) => deleteCloudinaryImage(url)))
}
