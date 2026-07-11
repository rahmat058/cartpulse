'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/account/UserAvatar'
import { Button } from '@/components/ui/Button'
import { formatOAuthProviderLabel } from '@/lib/auth/providers'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'
import { canUploadCustomAvatar } from '@/lib/user-avatar'
import { cn } from '@/lib/utils'

const AVATAR_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml'

type ProfileAvatarSectionProps = {
  image?: string | null
  authProvider?: AuthMethodId
}

export function ProfileAvatarSection({ image, authProvider }: ProfileAvatarSectionProps) {
  const { data: session, update } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const displayImage = previewImage ?? image ?? session?.user?.image ?? null
  const canUpload = canUploadCustomAvatar(authProvider)
  const providerLabel =
    authProvider && authProvider !== 'credentials' ? formatOAuthProviderLabel(authProvider) : null

  async function handleUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)

      const response = await fetch('/api/user/avatar', { method: 'POST', body })
      const json = (await response.json()) as { data?: { url: string }; error?: string }

      if (!response.ok) {
        throw new Error(json.error ?? 'Upload failed')
      }

      const url = json.data?.url
      if (!url) throw new Error('Upload failed')

      setPreviewImage(url)
      await update({ image: url })
      toast.success('Avatar updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const response = await fetch('/api/user/avatar', { method: 'DELETE' })
      const json = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(json.error ?? 'Could not remove avatar')
      }

      setPreviewImage(null)
      await update({ image: null })
      toast.success('Avatar removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove avatar')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center dark:border-slate-800">
      <div className="relative shrink-0">
        <UserAvatar
          name={session?.user?.name}
          email={session?.user?.email}
          image={displayImage}
          size="lg"
          className="ring-slate-200 dark:ring-slate-700"
        />
        {canUpload ? (
          <button
            type="button"
            className="absolute right-0 bottom-0 inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Upload avatar">
            <Camera className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Profile photo</p>
          {canUpload ? (
            <p className="text-xs text-slate-500">
              Upload a square image (JPG, JPEG, PNG, WebP, or SVG). Stored securely on Cloudinary.
            </p>
          ) : providerLabel ? (
            <p className="text-xs text-slate-500">
              Your photo comes from {providerLabel} and updates when you sign in with that provider.
            </p>
          ) : null}
        </div>

        {canUpload ? (
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}>
              {displayImage ? 'Change photo' : 'Upload photo'}
            </Button>
            {displayImage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('border-rose-200 text-rose-600 hover:bg-rose-50')}
                loading={removing}
                onClick={() => void handleRemove()}>
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
