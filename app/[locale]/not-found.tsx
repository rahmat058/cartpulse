import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Home } from 'lucide-react'
import { NotFoundPanel } from '@/components/lottie/NotFoundPanel'
import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <StorefrontShell>
        <StorefrontContainer as="main" className="flex flex-1 flex-col">
          <NotFoundPanel
            badge={t('badge')}
            title={t('title')}
            description={t('description')}
            actions={
              <>
                <Link href="/">
                  <Button size="lg" className="gap-2.5">
                    <Home className="size-5" />
                    {t('backHome')}
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" size="lg" className="gap-2.5">
                    {t('browseProducts')}
                    <ArrowRight className="size-5" />
                  </Button>
                </Link>
              </>
            }
          />
        </StorefrontContainer>
      </StorefrontShell>
    </div>
  )
}
