import { getTranslations } from 'next-intl/server'

export type HeroSlideData = {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
  secondaryHref?: string
  secondaryCta?: string
  imageUrl: string
  imageAlt: string
  gradient: string
  /** Tailwind object-position utility for hero crop */
  imagePosition?: string
}

type HeroSlideId = 'summer-sale' | 'tech-hub' | 'fashion-flash' | 'home-deals'

type HeroSlideConfig = {
  id: HeroSlideId
  href: string
  secondaryHref?: string
  gradient: string
  imageUrl: string
  imageAlt: string
  imagePosition?: string
}

/** Curated wide hero images — stable loremflickr locks, category-relevant subjects. */
const HERO_SLIDE_CONFIG: HeroSlideConfig[] = [
  {
    id: 'summer-sale',
    href: '/products?category=automobiles-helmets',
    secondaryHref: '/products?category=automobiles-helmets&sort=rating-desc',
    gradient: 'from-slate-950/92 via-slate-900/78 to-orange-950/40',
    imageUrl: 'https://res.cloudinary.com/dcsmzfbrd/image/upload/v1783759688/cartpulse/motor-cycle_euhlnj.jpg',
    imageAlt: 'Motorcycle and riding gear promotion',
    imagePosition: 'object-center',
  },
  {
    id: 'tech-hub',
    href: '/products?category=electronics-gadget',
    gradient: 'from-slate-950/90 via-teal-950/80 to-cyan-900/35',
    imageUrl: 'https://res.cloudinary.com/dcsmzfbrd/image/upload/v1783759440/cartpulse/smart-tv_tboyun.jpg',
    imageAlt: 'Flat-screen smart TV in a modern living room',
    imagePosition: 'object-[center_40%]',
  },
  {
    id: 'fashion-flash',
    href: '/products?category=fashion',
    gradient: 'from-teal-950/90 via-emerald-950/75 to-teal-800/35',
    imageUrl: 'https://res.cloudinary.com/dcsmzfbrd/image/upload/v1783759796/cartpulse/fashion_yml9cb.jpg',
    imageAlt: 'Sneakers and fashion footwear collection',
    imagePosition: 'object-center',
  },
  {
    id: 'home-deals',
    href: '/products?category=appliances',
    gradient: 'from-cyan-950/90 via-teal-950/80 to-emerald-900/35',
    imageUrl: 'https://res.cloudinary.com/dcsmzfbrd/image/upload/v1783759864/cartpulse/home-appliance_xhafw0.jpg',
    imageAlt: 'Washing machine and home appliances',
    imagePosition: 'object-center',
  },
]

export async function getHeroSlides(): Promise<HeroSlideData[]> {
  const t = await getTranslations('hero.slides')

  return HERO_SLIDE_CONFIG.map((config) => {
    const withSecondary = Boolean(config.secondaryHref)
    return {
      id: config.id,
      eyebrow: t(`${config.id}.eyebrow`),
      title: t(`${config.id}.title`),
      description: t(`${config.id}.description`),
      href: config.href,
      cta: t(`${config.id}.cta`),
      secondaryHref: config.secondaryHref,
      secondaryCta: withSecondary && config.id === 'summer-sale' ? t('summer-sale.secondaryCta') : undefined,
      gradient: config.gradient,
      imageUrl: config.imageUrl,
      imageAlt: config.imageAlt,
      imagePosition: config.imagePosition,
    }
  })
}
