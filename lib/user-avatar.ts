import type { AuthMethodId } from '@/lib/auth/user-auth-methods'

export function userInitials(name?: string | null, email?: string | null): string {
  const source = (name ?? email ?? '?').trim()
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Custom Cloudinary avatars are only for email/password sign-in sessions. */
export function canUploadCustomAvatar(authProvider?: AuthMethodId): boolean {
  return authProvider === 'credentials'
}

export function isOAuthAvatarUrl(url: string): boolean {
  return (
    url.includes('googleusercontent.com') ||
    url.includes('avatars.githubusercontent.com') ||
    url.includes('githubusercontent.com')
  )
}
