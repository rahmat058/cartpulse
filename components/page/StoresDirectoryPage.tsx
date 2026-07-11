import { listStoreProfiles } from '@/lib/services/stores'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { StoreCard } from '@/components/storefront/StoreCard'

export async function StoresDirectoryPage() {
  const stores = await listStoreProfiles()

  return (
    <StorefrontContainer as="main" className="py-8">
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Stores' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">All stores</h1>
        <p className="mt-2 text-sm text-slate-500">
          {stores.length} marketplace store{stores.length === 1 ? '' : 's'} on CartPulse
        </p>
      </div>

      {stores.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          No stores are available right now.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </StorefrontContainer>
  )
}
