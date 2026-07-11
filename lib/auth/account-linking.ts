import type { OAuthProviderId } from '@/lib/auth/providers'

/** Providers whose emails are verified by the issuer — safe to link to an existing account. */
export const TRUSTED_OAUTH_PROVIDERS: readonly OAuthProviderId[] = ['google', 'github']

export function isTrustedOAuthProvider(provider: string | undefined | null): provider is OAuthProviderId {
  return Boolean(provider && TRUSTED_OAUTH_PROVIDERS.includes(provider as OAuthProviderId))
}

export function formatOAuthProviders(providers: string[]): string {
  const labels = providers.map((provider) => {
    if (provider === 'google') return 'Google'
    if (provider === 'github') return 'GitHub'
    return provider
  })

  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`
}
