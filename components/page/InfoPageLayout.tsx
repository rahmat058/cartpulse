import { cn } from '@/lib/utils/cn'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

type InfoPageLayoutProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function InfoPageLayout({ title, subtitle, children, className }: InfoPageLayoutProps) {
  return (
    <StorefrontContainer as="main" className={cn('py-8 sm:py-10', className)}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{title}</h1>
          {subtitle ? (
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{subtitle}</p>
          ) : null}
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </StorefrontContainer>
  )
}

export function InfoSection({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('glass-card p-6 sm:p-8', className)}>
      {title ? <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2> : null}
      <div className={cn(title && 'mt-4', 'space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300')}>
        {children}
      </div>
    </section>
  )
}
