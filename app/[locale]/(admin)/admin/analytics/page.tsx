import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Revenue trends, order volume, and top-selling products."
      />
      <AnalyticsDashboard />
    </div>
  )
}
