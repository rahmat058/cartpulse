import { auth } from '@/lib/auth'
import { listUserLibrary } from '@/lib/services/library'
import { AccountLibraryPanel } from '@/components/account/AccountLibraryPanel'

export default async function DashboardLibraryPage() {
  const session = await auth()
  const items = session?.user?.id ? await listUserLibrary(session.user.id) : []

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Library</h2>
        <p className="mt-1 text-sm text-slate-500">
          {items.length > 0
            ? `${items.length} digital ${items.length === 1 ? 'item' : 'items'} ready to download`
            : 'Digital purchases available anytime'}
        </p>
      </div>
      <AccountLibraryPanel items={items} />
    </div>
  )
}
