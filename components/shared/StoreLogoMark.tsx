import { cn } from '@/lib/utils'

type StoreLogoMarkProps = {
  name: string
  logoUrl?: string | null
  logoEmoji?: string | null
  className?: string
}

export function StoreLogoMark({ name, logoUrl, logoEmoji, className }: StoreLogoMarkProps) {
  const initial = name.charAt(0).toUpperCase()
  const fallback = logoEmoji && logoEmoji.length <= 2 ? logoEmoji : initial

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={cn('h-full w-full object-cover', className)} />
    )
  }

  return <span className={className}>{fallback}</span>
}
