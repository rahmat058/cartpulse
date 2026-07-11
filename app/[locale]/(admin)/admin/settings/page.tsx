import { AdminSettingsPage } from '@/components/dashboard/AdminSettingsPage'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default function AdminSettingsRoute() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Storefront defaults, pricing, and platform configuration."
      />
      <AdminSettingsPage />
    </div>
  )
}
