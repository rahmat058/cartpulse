type OAuthProfile = {
  email?: string | null
}

/** Resolve email from Auth.js user/profile payloads (Google/GitHub). */
export function resolveOAuthEmail(
  user: { email?: string | null },
  profile?: unknown,
): string | undefined {
  const fromUser = user.email?.trim().toLowerCase()
  if (fromUser) return fromUser

  if (profile && typeof profile === 'object' && 'email' in profile) {
    const fromProfile = (profile as OAuthProfile).email?.trim().toLowerCase()
    if (fromProfile) return fromProfile
  }

  return undefined
}
