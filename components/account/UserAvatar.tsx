import { cn } from '@/lib/utils'
import { userInitials } from '@/lib/user-avatar'

type UserAvatarProps = {
  name?: string | null
  email?: string | null
  image?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'size-7 text-[10px]',
  sm: 'size-10 text-xs',
  md: 'size-12 text-sm',
  lg: 'size-20 text-lg',
} as const

export function UserAvatar({ name, email, image, size = 'md', className }: UserAvatarProps) {
  const initials = userInitials(name, email)

  if (image) {
    return (
      <img
        src={image}
        alt=""
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-900',
          sizeClasses[size],
          className,
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-teal-600 font-semibold text-white shadow-sm',
        sizeClasses[size],
        className,
      )}
      aria-hidden>
      {initials}
    </span>
  )
}
