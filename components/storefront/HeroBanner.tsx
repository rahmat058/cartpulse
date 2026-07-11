'use client'

import 'swiper/css'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Autoplay } from 'swiper/modules'
import { Button } from '@/components/ui/Button'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HeroSlideData } from '@/lib/commerce/hero-slides'
import { HeroPromoSidebar } from '@/components/storefront/HeroPromoSidebar'

export function HeroBanner({ slides }: { slides: HeroSlideData[] }) {
  const t = useTranslations('hero')
  const [swiper, setSwiper] = useState<SwiperType | null>(null)

  if (slides.length === 0) return null

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(200px,380px)] lg:items-stretch">
      <div className="hero-swiper relative min-w-0">
        <Swiper
          modules={[Autoplay]}
          slidesPerView={1}
          loop={slides.length > 1}
          speed={650}
          autoplay={slides.length > 1 ? { delay: 5500, disableOnInteraction: false } : false}
          onSwiper={setSwiper}
          className="h-full overflow-hidden rounded-xl shadow-xl shadow-teal-500/15">
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative min-h-[320px] overflow-hidden sm:min-h-[380px] lg:min-h-[440px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageUrl}
                  alt={slide.imageAlt}
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover',
                    slide.imagePosition ?? 'object-center',
                  )}
                />
                <div className={cn('absolute inset-0 bg-linear-to-r', slide.gradient)} />
                <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-center px-8 py-12 sm:min-h-[380px] sm:px-10 sm:py-14 lg:min-h-[440px] lg:max-w-xl lg:px-12">
                  <p className="text-xs font-bold tracking-widest text-white/80 uppercase">{slide.eyebrow}</p>
                  <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{slide.title}</h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
                    {slide.description}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={slide.href as '/products'}>
                      <Button className="h-10 bg-white px-5 text-teal-800 hover:bg-teal-50">{slide.cta}</Button>
                    </Link>
                    {slide.secondaryHref && slide.secondaryCta ? (
                      <Link href={slide.secondaryHref as '/products'}>
                        <Button
                          variant="outline"
                          className="h-10 border-white/40 bg-white/10 px-5 text-white hover:bg-white/20">
                          {slide.secondaryCta}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label={t('prevSlide')}
              onClick={() => swiper?.slidePrev()}
              className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-white/25 sm:left-4 sm:size-11">
              <ChevronLeft className="size-5 sm:size-6" />
            </button>
            <button
              type="button"
              aria-label={t('nextSlide')}
              onClick={() => swiper?.slideNext()}
              className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-4 sm:size-11">
              <ChevronRight className="size-5 sm:size-6" />
            </button>
          </>
        ) : null}
      </div>

      <HeroPromoSidebar />
    </section>
  )
}
