'use client'

import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import type { Product } from '@/types/cart'
import { ProductPricing } from '@/lib/commerce/ProductPricing'
import { formatCurrency } from '@/lib/utils/cartPricing'
import 'swiper/css'
import 'swiper/css/pagination'

export function FeaturedCarousel({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <div className="featured-swiper">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
      >
        {products.map((product) => {
          const pricing = ProductPricing.for(product)
          return (
            <SwiperSlide key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="glass-card flex h-full flex-col gap-3 overflow-hidden p-0 transition-transform hover:-translate-y-0.5"
              >
                <div className="relative flex h-40 items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50 text-5xl">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    product.emoji
                  )}
                  <span className="absolute top-2 left-2 rounded bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    -{pricing.discountPercent}%
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-600">
                    {product.category}
                  </p>
                  <h3 className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{product.name}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-lg font-bold text-teal-700">{formatCurrency(pricing.salePrice)}</p>
                    <p className="text-xs text-slate-400 line-through">
                      {formatCurrency(pricing.originalPrice)}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
