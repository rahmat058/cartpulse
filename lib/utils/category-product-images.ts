/**
 * Curated Unsplash photo IDs per catalog category (verified HTTP 200, square crop).
 * Used for demo seed data and to repair broken loremflickr / picsum placeholders.
 */
export const CATEGORY_PRODUCT_IMAGE_IDS: Record<string, string[]> = {
  'electronics-gadget': [
    'photo-1505740420928-5e560c06d30e', // headphones
    'photo-1523275335684-37898b6baf30', // watch
    'photo-1511707171634-5f897ff02aa9', // phone
    'photo-1498049794561-7780e7231661', // laptop
    'photo-1546868871-7041f2a55e12', // smartwatch
    'photo-1484704849700-f032a568e944', // headphones
    'photo-1587829741301-dc798b83add3', // keyboard
    'photo-1593640408182-31c70c8268f5', // desktop setup
    'photo-1526170375885-4d8ecf77b99f', // camera
    'photo-1572569511254-d8f925fe2cbb', // earbuds case
    'photo-1606220945770-b5b6c2c55bf1', // speaker
    'photo-1517336714731-489689fd1ca8', // macbook
  ],
  'personal-care': [
    'photo-1556228578-0d85b1a4d571', // skincare bottles
    'photo-1596462502278-27bfdc403348', // makeup flatlay
    'photo-1522335789203-aabd1fc54bc9', // beauty products
    'photo-1631214524020-7e18db9a8f92', // serum dropper
    'photo-1611930022073-b7a4ba5fcccd', // skincare routine
    'photo-1570172619644-dfd03ed5d881', // facial care
    'photo-1512496015851-a90fb38ba796', // lipstick / beauty
    'photo-1598440947619-2c35fc9aa908', // cosmetics
    'photo-1608571423902-eed4a5ad8108', // body care
  ],
  appliances: [
    'photo-1556910103-1c02745aae4d', // kitchen appliances
    'photo-1556909114-f6e7ad7d3136', // cookware appliances
    'photo-1585515320310-259814833e62', // toaster kitchen
    'photo-1585659722983-3a675dabf23d', // vacuum
    'photo-1590794056226-79ef3a8147e1', // coffee machine
    'photo-1570222094114-d054a817e56b', // blender bowl
    'photo-1556911220-bff31c812dba', // modern kitchen
    'photo-1600585152220-90363fe7e115', // appliance kitchen
  ],
  'kitchen-dining': [
    'photo-1556911220-bff31c812dba', // kitchen cooking
    'photo-1556909114-f6e7ad7d3136', // pots pans
    'photo-1600585152220-90363fe7e115', // dining kitchen
    'photo-1578749556568-bc2c40e68b61', // tableware
    'photo-1490645935967-10de6ba17061', // food prep
    'photo-1504674900247-0877df9cc836', // plated food
    'photo-1565299624946-b28f40a0ae38', // pizza / dining
    'photo-1546548970-71785318a17b', // fresh produce prep
  ],
  'food-grocery': [
    'photo-1542838132-92c53300491e', // grocery produce
    'photo-1610832958506-aa56368176cf', // fruit market
    'photo-1586201375761-83865001e31c', // grains / pantry
    'photo-1516594798947-e65505dbb29d', // grocery bag
    'photo-1567306301408-9b74779a11af', // tomato / fresh
    'photo-1509440159596-0249088772ff', // bread bakery
    'photo-1546069901-ba9599a7e63c', // healthy bowl
    'photo-1512621776951-a57141f2eefd', // salad / grocery
    'photo-1490818387583-1baba5e638af', // vegetables
  ],
  fashion: [
    'photo-1445205170230-053b83016050', // clothing rack
    'photo-1515886657613-9f3515b0c78f', // fashion look
    'photo-1490481651871-ab68de25d43d', // fashion flatlay
    'photo-1469334031218-e382a71b716b', // apparel
    'photo-1551028719-00167b16eac5', // jacket
    'photo-1542272604-787c3835535d', // jeans
    'photo-1549298916-b41d501d3772', // sneakers
    'photo-1487222477894-8943e31ef7b2', // streetwear
    'photo-1434389677669-e08b4cac3105', // knitwear
    'photo-1523381210434-271e8be1f52b', // t-shirts
  ],
  'automobiles-helmets': [
    'photo-1558981403-c5f9899a28bc', // motorcycle
    'photo-1558618666-fcd25c85cd64', // helmet close-up
    'photo-1609630875171-b1321377ee65', // riding helmet
    'photo-1568772585407-9361f9bf3a87', // motorbike
    'photo-1552519507-da3b142c6e3d', // car
    'photo-1492144534655-ae79c964c9d7', // sports car
    'photo-1503376780353-7e6692767b70', // luxury car
    'photo-1486006920555-c77dcf18193c', // classic car
  ],
  'health-care': [
    'photo-1576091160399-112ba8d25d1d', // medical tech
    'photo-1584308666744-24d5c474f2ae', // pills / pharmacy
    'photo-1579154204601-01588f351e67', // stethoscope
    'photo-1530497610245-94d3c16cda28', // medical tools
    'photo-1607619056574-7b8d3ee536b2', // vitamins
    'photo-1581595220892-b0739db3b8c5', // clinic
    'photo-1579684385127-1ef15d508118', // hospital care
    'photo-1631815588090-d4bfec5b1ccb', // healthcare
    'photo-1582719471384-894fbb16e074', // lab / health
  ],
}

/** Keyword fragments found in legacy loremflickr paths → category slug */
export const IMAGE_KEYWORD_TO_CATEGORY: Record<string, string> = {
  gadget: 'electronics-gadget',
  electronics: 'electronics-gadget',
  headphones: 'electronics-gadget',
  usb: 'electronics-gadget',
  cable: 'electronics-gadget',
  skincare: 'personal-care',
  cosmetics: 'personal-care',
  beauty: 'personal-care',
  appliance: 'appliances',
  kitchen: 'kitchen-dining',
  blender: 'appliances',
  dining: 'kitchen-dining',
  cookware: 'kitchen-dining',
  grocery: 'food-grocery',
  food: 'food-grocery',
  organic: 'food-grocery',
  fashion: 'fashion',
  clothing: 'fashion',
  apparel: 'fashion',
  motorcycle: 'automobiles-helmets',
  helmet: 'automobiles-helmets',
  automotive: 'automobiles-helmets',
  health: 'health-care',
  medical: 'health-care',
  wellness: 'health-care',
  book: 'electronics-gadget',
  guide: 'electronics-gadget',
  design: 'fashion',
  template: 'fashion',
  journal: 'health-care',
}

/** Demo lock ranges used by `scripts/generate-products.mjs` (25 products × 8 categories). */
export const DEMO_LOCK_CATEGORY_RANGES: Array<{ start: number; end: number; category: string }> = [
  { start: 1, end: 25, category: 'electronics-gadget' },
  { start: 26, end: 50, category: 'personal-care' },
  { start: 51, end: 75, category: 'appliances' },
  { start: 76, end: 100, category: 'kitchen-dining' },
  { start: 101, end: 125, category: 'food-grocery' },
  { start: 126, end: 150, category: 'fashion' },
  { start: 151, end: 175, category: 'automobiles-helmets' },
  { start: 176, end: 201, category: 'health-care' },
  { start: 901, end: 901, category: 'electronics-gadget' },
  { start: 902, end: 902, category: 'fashion' },
  { start: 903, end: 903, category: 'health-care' },
]

export function unsplashProductImageUrl(photoId: string): string {
  const id = photoId.startsWith('photo-') ? photoId : `photo-${photoId}`
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&h=800&q=80`
}

export function categoryProductImageUrl(categorySlug: string, index = 0): string {
  const pool =
    CATEGORY_PRODUCT_IMAGE_IDS[categorySlug] ?? CATEGORY_PRODUCT_IMAGE_IDS['electronics-gadget']!
  const photoId = pool[Math.abs(index) % pool.length]!
  return unsplashProductImageUrl(photoId)
}

export function categoryFromDemoLock(lock: number): string | null {
  for (const range of DEMO_LOCK_CATEGORY_RANGES) {
    if (lock >= range.start && lock <= range.end) return range.category
  }
  return null
}

export function categoryFromImageKeywords(keywords: string): string | null {
  const parts = keywords
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  for (const part of parts) {
    const hit = IMAGE_KEYWORD_TO_CATEGORY[part]
    if (hit) return hit
  }
  return null
}

function stableIndex(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

export function isDemoPlaceholderImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host === 'loremflickr.com' ||
      host === 'www.loremflickr.com' ||
      host === 'picsum.photos' ||
      host === 'www.picsum.photos'
    )
  } catch {
    return false
  }
}

/**
 * Pick a category-relevant demo image. Prefer an explicit category slug when available.
 */
export function resolveCategoryProductImage(options: {
  categorySlug?: string | null
  productId?: string | null
  lock?: number | string | null
  keywords?: string | null
}): string {
  const category =
    options.categorySlug ||
    (options.lock != null && options.lock !== ''
      ? categoryFromDemoLock(Number(options.lock))
      : null) ||
    (options.keywords ? categoryFromImageKeywords(options.keywords) : null) ||
    'electronics-gadget'

  const indexSeed = options.productId || String(options.lock ?? category)
  return categoryProductImageUrl(category, stableIndex(indexSeed))
}
