import { cn } from '@/lib/utils/cn'

/** Shared max-width + horizontal padding aligned with Header and Footer. */
export const storefrontContainerClass = 'mx-auto w-full max-w-7xl px-4 sm:px-6'

/** Same width & gutters as the storefront Header / Footer inner container. */
export function StorefrontContainer({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'main' | 'section'
}) {
  return (
    <Tag className={cn(storefrontContainerClass, 'flex-1', className)}>
      {children}
    </Tag>
  )
}
