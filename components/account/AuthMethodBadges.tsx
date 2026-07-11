import { Mail, ShieldCheck } from 'lucide-react'
import { GitHubIcon, GoogleIcon } from '@/components/auth/OAuthIcons'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'
import { formatOAuthProviderLabel } from '@/lib/auth/providers'
import { cn } from '@/lib/utils'

const AUTH_METHOD_CONFIG: Record<
  AuthMethodId,
  {
    label: string
    activeDescription: string
    iconClassName: string
    activeChipClassName: string
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  credentials: {
    label: 'Email & password',
    activeDescription: 'You signed in with your CartPulse password',
    iconClassName: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    activeChipClassName:
      'border-teal-300 bg-teal-50/80 ring-1 ring-teal-200/80 dark:border-teal-800 dark:bg-teal-950/30 dark:ring-teal-900/60',
    Icon: Mail,
  },
  google: {
    label: 'Google',
    activeDescription: 'You signed in with your Google account',
    iconClassName:
      'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700',
    activeChipClassName:
      'border-slate-300 bg-white ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900/60 dark:ring-slate-700',
    Icon: GoogleIcon,
  },
  github: {
    label: 'GitHub',
    activeDescription: 'You signed in with your GitHub account',
    iconClassName: 'bg-slate-900 text-white dark:bg-slate-950',
    activeChipClassName:
      'border-slate-400 bg-slate-50 ring-1 ring-slate-200 dark:border-slate-600 dark:bg-slate-900/60 dark:ring-slate-700',
    Icon: GitHubIcon,
  },
}

type AuthMethodBadgeProps = {
  method: AuthMethodId
}

export function AuthMethodBadges({ method }: AuthMethodBadgeProps) {
  const config = AUTH_METHOD_CONFIG[method]
  const Icon = config.Icon

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-slate-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Sign-in method</p>
      </div>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border px-3 py-2.5',
          config.activeChipClassName,
        )}>
        <span
          className={cn(
            'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
            config.iconClassName,
          )}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{config.label}</p>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              Active
            </span>
          </div>
          <p className="truncate text-xs text-slate-500">{config.activeDescription}</p>
        </div>
      </div>
    </div>
  )
}

export function OAuthManagedAccountNote({ method }: AuthMethodBadgeProps) {
  if (method === 'credentials') return null

  const providerLabel = formatOAuthProviderLabel(method)

  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
      Your name and email are managed by {providerLabel}. Password changes are not available for social
      sign-in accounts.
    </p>
  )
}

export function AuthMethodRefreshNote() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
      Sign out and sign in again to refresh your active sign-in method.
    </p>
  )
}
