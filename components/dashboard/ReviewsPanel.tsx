'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { reviewSchema, type ReviewFormValues } from '@/lib/validations/account'

interface ReviewProduct {
  name: string
  emoji: string
  slug: string
  imageUrl: string | null
  imageUrls?: string[]
}

interface ReviewRow {
  id: string
  rating: number
  body: string | null
  product: ReviewProduct
  createdAt: string
}

function reviewProductImage(product: ReviewProduct) {
  return product.imageUrl ?? product.imageUrls?.[0] ?? null
}

export function ReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId: '',
      rating: 5,
      body: '',
    },
  })

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((json: { data?: ReviewRow[] }) => setReviews(json.data ?? []))
      .catch(() => {})
  }, [])

  async function onSubmit(values: ReviewFormValues) {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: values.productId,
        rating: values.rating,
        body: values.body || undefined,
      }),
    })
    const json = (await response.json()) as { error?: string; data?: ReviewRow }

    if (!response.ok) {
      toast.error(json.error ?? 'Failed to submit review')
      return
    }

    if (json.data) {
      setReviews((current) => [json.data!, ...current])
      reset({ productId: '', rating: 5, body: '' })
      toast.success('Review submitted')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold">Write a review</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-3" noValidate>
          <div>
            <Input
              placeholder="Product ID"
              {...register('productId')}
              aria-invalid={Boolean(errors.productId)}
            />
            {errors.productId ? (
              <p className="mt-1 text-xs text-rose-600">{errors.productId.message}</p>
            ) : null}
          </div>
          <div>
            <Input
              type="number"
              min={1}
              max={5}
              {...register('rating', { valueAsNumber: true })}
              aria-invalid={Boolean(errors.rating)}
            />
            {errors.rating ? (
              <p className="mt-1 text-xs text-rose-600">{errors.rating.message}</p>
            ) : null}
          </div>
          <div>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Your review (optional)"
              {...register('body')}
            />
            {errors.body ? (
              <p className="mt-1 text-xs text-rose-600">{errors.body.message}</p>
            ) : null}
          </div>
          <Button type="submit" loading={isSubmitting}>
            Submit review
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {reviews.map((review) => {
          const imageUrl = reviewProductImage(review.product)
          const productHref = `/products/${review.product.slug}`

          return (
            <Card key={review.id}>
              <div className="flex gap-4">
                <Link
                  href={productHref}
                  className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-linear-to-br from-teal-50 to-cyan-50 text-4xl dark:border-slate-700 dark:from-teal-950/60 dark:to-slate-900 sm:size-32"
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span aria-hidden>{review.product.emoji}</span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={productHref}
                    className="font-medium text-slate-800 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400"
                  >
                    {review.product.name}
                  </Link>
                  <p className="mt-1 text-sm text-amber-600">{'★'.repeat(review.rating)}</p>
                  {review.body ? (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.body}</p>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
