import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import productsData from '../data/products.json'
import { grantLibraryAccessForOrder } from '../lib/services/library'

const DEMO_DIGITAL_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

interface SeedVariant {
  sku: string
  slug: string
  color: string
  hex: string
  stock: number
  price?: number
  emoji?: string
  isDefault?: boolean
}

interface SeedProduct {
  storeSlug: string
  slug: string
  name: string
  category: string
  price: number
  stock: number
  rating: number
  emoji: string
  imageUrl?: string
  published?: boolean
  description: string
  isDigital?: boolean
  digitalAssetUrl?: string
  defaultVariantSlug?: string
  variants?: SeedVariant[]
}

interface SeedStore {
  slug: string
  name: string
  description?: string
  supportEmail?: string
  logoEmoji?: string
  currency?: string
  taxRate?: number
  shippingFlat?: number
  freeShippingThreshold?: number
  verified?: boolean
}

interface SeedCategory {
  slug: string
  name: string
  emoji?: string
  children?: Array<{ slug: string; name: string; emoji?: string }>
}

interface SeedFile {
  stores: SeedStore[]
  categories: SeedCategory[]
  data: SeedProduct[]
}

const catalog = productsData as SeedFile

async function seedStores() {
  const storeMap = new Map<string, string>()

  for (const store of catalog.stores) {
    const row = await prisma.store.upsert({
      where: { slug: store.slug },
      update: {
        name: store.name,
        description: store.description ?? null,
        supportEmail: store.supportEmail ?? null,
        logoEmoji: store.logoEmoji ?? '🛍️',
        currency: store.currency ?? 'USD',
        taxRate: store.taxRate ?? 0.08,
        shippingFlat: store.shippingFlat ?? 5.99,
        freeShippingThreshold: store.freeShippingThreshold ?? 75,
        active: true,
        verified: store.verified ?? false,
      },
      create: {
        slug: store.slug,
        name: store.name,
        description: store.description ?? null,
        supportEmail: store.supportEmail ?? null,
        logoEmoji: store.logoEmoji ?? '🛍️',
        currency: store.currency ?? 'USD',
        taxRate: store.taxRate ?? 0.08,
        shippingFlat: store.shippingFlat ?? 5.99,
        freeShippingThreshold: store.freeShippingThreshold ?? 75,
        active: true,
        verified: store.verified ?? false,
      },
    })
    storeMap.set(store.slug, row.id)
  }

  return storeMap
}

async function seedCategories() {
  const categoryMap = new Map<string, string>()

  for (const [index, category] of catalog.categories.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        emoji: category.emoji ?? '📦',
        sortOrder: index,
        parentId: null,
      },
      create: {
        slug: category.slug,
        name: category.name,
        emoji: category.emoji ?? '📦',
        sortOrder: index,
      },
    })
    categoryMap.set(category.slug, parent.id)

    for (const [childIndex, child] of (category.children ?? []).entries()) {
      const row = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          emoji: child.emoji ?? category.emoji ?? '📦',
          sortOrder: childIndex,
          parentId: parent.id,
        },
        create: {
          slug: child.slug,
          name: child.name,
          emoji: child.emoji ?? category.emoji ?? '📦',
          sortOrder: childIndex,
          parentId: parent.id,
        },
      })
      categoryMap.set(child.slug, row.id)
    }
  }

  return categoryMap
}

async function seedCoupons() {
  const coupons = [
    {
      code: 'SAVE10',
      type: 'PERCENT' as const,
      value: 0.1,
      label: '10% off',
      minSubtotal: null as number | null,
    },
    {
      code: 'FREESHIP',
      type: 'SHIPPING' as const,
      value: 0,
      label: 'Free shipping',
      minSubtotal: 25,
    },
    {
      code: 'CARTPULSE15',
      type: 'PERCENT' as const,
      value: 0.15,
      label: '15% off',
      minSubtotal: 50,
    },
  ]

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        type: coupon.type,
        value: coupon.value,
        label: coupon.label,
        active: true,
        minSubtotal: coupon.minSubtotal,
      },
      create: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        label: coupon.label,
        active: true,
        minSubtotal: coupon.minSubtotal,
      },
    })
  }

  return coupons.length
}

/** Wipe commerce + auth rows so a re-seed always recreates users and products cleanly. */
async function resetCatalog() {
  await prisma.wishlistItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.libraryItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  // Break Product ↔ ProductVariant circular FK before delete
  await prisma.product.updateMany({ data: { defaultVariantId: null } })
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()
}

/** Drop categories not present in the latest seed tree. */
async function pruneStaleCategories(categoryMap: Map<string, string>) {
  const keepSlugs = [...categoryMap.keys()]
  await prisma.category.deleteMany({
    where: {
      slug: { notIn: keepSlugs },
      products: { none: {} },
      children: { none: {} },
    },
  })
}

/** Drop stores not present in the latest seed payload. */
async function pruneStaleStores(storeMap: Map<string, string>) {
  const keepSlugs = [...storeMap.keys()]
  await prisma.store.deleteMany({
    where: {
      slug: { notIn: keepSlugs },
      products: { none: {} },
    },
  })
}

async function seedProduct(storeMap: Map<string, string>, categoryMap: Map<string, string>, product: SeedProduct) {
  const storeId = storeMap.get(product.storeSlug)
  if (!storeId) {
    throw new Error(`Unknown store "${product.storeSlug}" for product ${product.slug}`)
  }

  const categoryId = categoryMap.get(product.category)
  if (!categoryId) {
    throw new Error(`Unknown category "${product.category}" for product ${product.slug}`)
  }

  const defaultVariantSlug =
    product.defaultVariantSlug ?? product.variants?.find((variant) => variant.isDefault)?.slug ?? null

  const productRow = await prisma.product.create({
    data: {
      storeId,
      categoryId,
      slug: product.slug,
      name: product.name,
      price: product.price,
      stock: product.stock,
      rating: product.rating,
      emoji: product.emoji,
      imageUrl: product.imageUrl ?? null,
      description: product.description,
      published: product.published ?? true,
      isDigital: product.isDigital ?? false,
      digitalAssetUrl: product.isDigital ? product.digitalAssetUrl ?? null : null,
    },
  })

  let defaultVariantId: string | null = null

  if (product.variants?.length) {
    for (const variant of product.variants) {
      const isDefault = variant.isDefault ?? variant.slug === defaultVariantSlug
      const created = await prisma.productVariant.create({
        data: {
          productId: productRow.id,
          sku: variant.sku,
          slug: variant.slug,
          color: variant.color,
          hex: variant.hex,
          stock: variant.stock,
          price: variant.price ?? null,
          emoji: variant.emoji ?? null,
          isDefault,
        },
      })

      if (isDefault) {
        defaultVariantId = created.id
      }
    }
  }

  if (defaultVariantId) {
    await prisma.product.update({
      where: { id: productRow.id },
      data: { defaultVariantId },
    })
  }

  return productRow
}

async function seedDigitalDemoProducts(storeMap: Map<string, string>, categoryMap: Map<string, string>) {
  const digitalProducts: SeedProduct[] = [
    {
      storeSlug: 'tech-hub',
      slug: 'developer-handbook-ebook',
      name: 'Developer Handbook (eBook)',
      category: 'electronics-gadget',
      price: 19.99,
      stock: 0,
      rating: 4.8,
      emoji: '📘',
      imageUrl: 'https://loremflickr.com/800/800/book%2Cguide?lock=901',
      published: true,
      description: 'A practical eBook for building modern web apps — instant download after purchase.',
      isDigital: true,
      digitalAssetUrl: DEMO_DIGITAL_URL,
    },
    {
      storeSlug: 'cartpulse',
      slug: 'cartpulse-brand-style-guide',
      name: 'CartPulse Brand Style Guide (PDF)',
      category: 'fashion',
      price: 12.5,
      stock: 0,
      rating: 4.6,
      emoji: '🎨',
      imageUrl: 'https://loremflickr.com/800/800/design%2Ctemplate?lock=902',
      published: true,
      description: 'Logo usage, color palette, and typography rules for CartPulse storefront demos.',
      isDigital: true,
      digitalAssetUrl: DEMO_DIGITAL_URL,
    },
    {
      storeSlug: 'wellness-plus',
      slug: 'wellness-journal-template-pack',
      name: 'Wellness Journal Template Pack',
      category: 'health-care',
      price: 8.99,
      stock: 0,
      rating: 4.5,
      emoji: '📝',
      imageUrl: 'https://loremflickr.com/800/800/wellness%2Cjournal?lock=903',
      published: true,
      description: 'Printable and fillable journal templates for daily wellness tracking.',
      isDigital: true,
      digitalAssetUrl: DEMO_DIGITAL_URL,
    },
  ]

  for (const product of digitalProducts) {
    await seedProduct(storeMap, categoryMap, product)
  }

  return digitalProducts.length
}

async function seedUsers() {
  const demoPasswordHash = await bcrypt.hash('password123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: demoPasswordHash,
      emailVerified: true,
      permCreate: true,
      permRead: true,
      permUpdate: true,
      permDelete: true,
    },
    create: {
      email: 'superadmin@platform.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: demoPasswordHash,
      emailVerified: true,
      permCreate: true,
      permRead: true,
      permUpdate: true,
      permDelete: true,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: demoPasswordHash,
      emailVerified: true,
      permCreate: true,
      permRead: true,
      permUpdate: true,
      permDelete: false,
    },
    create: {
      email: 'admin@platform.com',
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: demoPasswordHash,
      emailVerified: true,
      permCreate: true,
      permRead: true,
      permUpdate: true,
      permDelete: false,
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: { name: 'Demo Customer', role: 'USER', passwordHash: demoPasswordHash, emailVerified: true },
    create: {
      email: 'customer@demo.com',
      name: 'Demo Customer',
      role: 'USER',
      passwordHash: demoPasswordHash,
      emailVerified: true,
    },
  })

  return { superAdmin, admin, customer }
}

async function seedDemoCommerce(customerId: string) {
  const products = await prisma.product.findMany({
    where: { published: true, isDigital: false },
    include: { variants: true },
    orderBy: { rating: 'desc' },
    take: 4,
  })

  const digitalProducts = await prisma.product.findMany({
    where: { published: true, isDigital: true },
    orderBy: { rating: 'desc' },
    take: 2,
  })

  if (products.length === 0 && digitalProducts.length === 0) return

  const [first, second, third] = products

  const paidLines = [
    ...(first
      ? [
          {
            productId: first.id,
            variantId: first.defaultVariantId ?? first.variants[0]?.id ?? null,
            quantity: 1,
            unitPrice: first.price,
          },
        ]
      : []),
    ...(second
      ? [
          {
            productId: second.id,
            variantId: second.defaultVariantId ?? second.variants[0]?.id ?? null,
            quantity: 2,
            unitPrice: second.price,
          },
        ]
      : []),
    ...digitalProducts.map((product) => ({
      productId: product.id,
      variantId: null,
      quantity: 1,
      unitPrice: product.price,
    })),
  ]

  const paidSubtotal = paidLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const paidTax = Math.round(paidSubtotal * 0.08 * 100) / 100
  const hasPhysical = paidLines.some((line) => products.some((product) => product.id === line.productId))
  const paidShipping = hasPhysical && paidSubtotal < 75 ? 5.99 : 0
  const paidTotal = Math.round((paidSubtotal + paidTax + paidShipping) * 100) / 100

  const paidOrder = await prisma.order.create({
    data: {
      userId: customerId,
      status: 'PAID',
      stripeSessionId: `seed_cs_${Date.now()}`,
      subtotal: paidSubtotal,
      tax: paidTax,
      shipping: paidShipping,
      discount: 0,
      total: paidTotal,
      items: { create: paidLines },
    },
  })

  await grantLibraryAccessForOrder(paidOrder.id)

  if (third) {
    await prisma.order.create({
      data: {
        userId: customerId,
        status: 'SHIPPED',
        subtotal: third.price,
        tax: Math.round(third.price * 0.08 * 100) / 100,
        shipping: 5.99,
        discount: 0,
        total: Math.round((third.price * 1.08 + 5.99) * 100) / 100,
        items: {
          create: [
            {
              productId: third.id,
              variantId: third.defaultVariantId ?? third.variants[0]?.id ?? null,
              quantity: 1,
              unitPrice: third.price,
            },
          ],
        },
      },
    })
  }

  for (const product of products.slice(0, 2)) {
    await prisma.wishlistItem.create({
      data: {
        userId: customerId,
        productId: product.id,
      },
    })
  }

  if (first) {
    await prisma.review.create({
      data: {
        userId: customerId,
        productId: first.id,
        rating: 5,
        body: 'Excellent quality — exactly what I expected from the CartPulse demo catalog.',
      },
    })
  }

  if (second) {
    await prisma.review.create({
      data: {
        userId: customerId,
        productId: second.id,
        rating: 4,
        body: 'Great value. Would recommend.',
      },
    })
  }
}

async function seed() {
  console.log('🌱 Seeding database (schema-aligned)...\n')

  // Always start from empty commerce + users, then recreate from products.json + demo accounts.
  await resetCatalog()

  const storeMap = await seedStores()
  console.log(`✅ Stores: ${storeMap.size} (tax / shipping defaults applied)`)

  const categoryMap = await seedCategories()
  console.log(`✅ Categories: ${categoryMap.size}`)

  await pruneStaleCategories(categoryMap)
  await pruneStaleStores(storeMap)

  const couponCount = await seedCoupons()
  console.log(`✅ Coupons: ${couponCount}`)

  for (const product of catalog.data) {
    await seedProduct(storeMap, categoryMap, product)
  }

  const digitalCount = await seedDigitalDemoProducts(storeMap, categoryMap)

  const draftCount = catalog.data.filter((p) => p.published === false).length
  const publishedCount = catalog.data.length - draftCount
  console.log(
    `✅ Products: ${catalog.data.length + digitalCount} (${publishedCount + digitalCount} published, ${draftCount} draft, ${digitalCount} digital)`,
  )

  const { customer } = await seedUsers()
  console.log('✅ Demo users: superadmin@platform.com / admin@platform.com / customer@demo.com (password123)')

  await seedDemoCommerce(customer.id)
  console.log('✅ Sample orders, library, wishlist, and reviews\n')
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
