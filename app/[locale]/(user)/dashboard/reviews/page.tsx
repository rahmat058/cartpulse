import { MessageSquare } from 'lucide-react'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ReviewsPanel } from '@/components/dashboard/ReviewsPanel'
import { AccountEmptyState } from '@/components/account/AccountEmptyState'

export default async function DashboardReviewsPage() {
  const session = await auth()
  const reviewCount = session?.user?.id
    ? await prisma.review.count({ where: { userId: session.user.id } })
    : 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Reviews</h2>
        <p className="mt-1 text-sm text-slate-500">Ratings you left on purchased products</p>
      </div>
      {reviewCount === 0 ? (
        <AccountEmptyState
          title="No reviews yet"
          description="After you shop, you can rate products and help other buyers decide."
          icon={<MessageSquare className="h-9 w-9" strokeWidth={1.5} />}
        />
      ) : (
        <ReviewsPanel />
      )}
    </div>
  )
}
