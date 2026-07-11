export type OAuthProviderId = 'google' | 'github'

export type OAuthProviders = Record<OAuthProviderId, boolean>

/** Which OAuth providers are configured via env (safe to call on server). */
export function getOAuthProviders(): OAuthProviders {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  }
}

export function formatOAuthProviderLabel(provider: string): string {
  if (provider === 'google') return 'Google'
  if (provider === 'github') return 'GitHub'
  return provider
}
