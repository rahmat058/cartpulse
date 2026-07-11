'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import type { ProductReviewItem } from '@/lib/services/reviews'

const productReviewFormSchema = z.object({
  rating: z
    .number({ error: 'Select a star rating' })
    .int()
    .min(1, 'Select at least 1 star')
    .max(5, 'Max rating is 5 stars'),
  body: z.string().trim().max(2000, 'Review is too long').optional().or(z.literal('')),
})

type ProductReviewFormValues = z.infer<typeof productReviewFormSchema>

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
        >
          <Star
            className={cn(
              'h-7 w-7',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
            )}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700',
          )}
        />
      ))}
    </div>
  )
}

function formatReviewDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

interface ProductReviewsTabProps {
  productId: string
  initialReviews: ProductReviewItem[]
}

export function ProductReviewsTab({ productId, initialReviews }: ProductReviewsTabProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const [reviews, setReviews] = useState(initialReviews)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductReviewFormValues>({
    resolver: zodResolver(productReviewFormSchema),
    defaultValues: { rating: 0, body: '' },
  })

  const hasUserReview = Boolean(userId && reviews.some((review) => review.userId === userId))

  async function onSubmit(values: ProductReviewFormValues) {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        rating: values.rating,
        body: values.body || undefined,
      }),
    })

    const json = (await response.json()) as { error?: string; data?: ProductReviewItem }

    if (!response.ok) {
      toast.error(json.error ?? 'Failed to submit review')
      return
    }

    if (json.data) {
      setReviews((current) => [json.data!, ...current])
      reset({ rating: 0, body: '' })
      toast.success('Review submitted')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Customer reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <p className="mt-3 text-slate-500">No reviews yet — be the first to share your experience.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-md border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{review.author}</p>
                  <time className="text-xs text-slate-400" dateTime={review.createdAt}>
                    {formatReviewDate(review.createdAt)}
                  </time>
                </div>
                <div className="mt-2">
                  <ReviewStars rating={review.rating} />
                </div>
                {review.body ? <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{review.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Write a review</h3>

        {status === 'loading' ? (
          <p className="mt-3 text-sm text-slate-500">Checking sign-in status…</p>
        ) : !userId ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Please{' '}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
              className="font-semibold text-teal-700 hover:underline dark:text-teal-400"
            >
              sign in
            </Link>{' '}
            to leave a review.
          </p>
        ) : hasUserReview ? (
          <p className="mt-3 text-sm text-slate-500">You have already reviewed this product.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 max-w-xl space-y-4" noValidate>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Your rating</p>
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <StarRatingInput value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                )}
              />
              {errors.rating ? <p className="mt-1 text-xs text-rose-600">{errors.rating.message}</p> : null}
            </div>

            <div>
              <label htmlFor="review-body" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Your review
              </label>
              <textarea
                id="review-body"
                rows={4}
                placeholder="Share what you liked or what could be improved…"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                {...register('body')}
              />
              {errors.body ? <p className="mt-1 text-xs text-rose-600">{errors.body.message}</p> : null}
            </div>

            <Button type="submit" loading={isSubmitting}>
              Submit review
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
