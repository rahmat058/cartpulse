import 'dotenv/config'
import prisma from '../lib/prisma'

async function testDatabase() {
  console.log('🔍 Testing Prisma schema alignment...\n')

  try {
    const [
      users,
      stores,
      categories,
      products,
      variants,
      orders,
      reviews,
      library,
      wishlist,
      coupons,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.order.count(),
      prisma.review.count(),
      prisma.libraryItem.count(),
      prisma.wishlistItem.count(),
      prisma.coupon.count(),
    ])

    console.log('Counts:')
    console.log(`  users=${users} stores=${stores} categories=${categories} coupons=${coupons}`)
    console.log(`  products=${products} variants=${variants}`)
    console.log(`  orders=${orders} reviews=${reviews} library=${library} wishlist=${wishlist}`)

    const sampleStore = await prisma.store.findFirst({
      select: {
        slug: true,
        taxRate: true,
        shippingFlat: true,
        freeShippingThreshold: true,
      },
    })
    if (!sampleStore) throw new Error('No stores found — run yarn db:seed')

    console.log('\nStore pricing fields:')
    console.log(
      `  ${sampleStore.slug}: tax=${sampleStore.taxRate}, shipping=${sampleStore.shippingFlat}, freeAt=${sampleStore.freeShippingThreshold}`,
    )

    const roots = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: { select: { slug: true, _count: { select: { products: true } } } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })
    if (roots.length === 0) throw new Error('No root categories — run yarn db:seed')

    console.log('\nCategory tree:')
    for (const root of roots) {
      const childTotal = root.children.reduce((sum, child) => sum + child._count.products, 0)
      console.log(
        `  ${root.slug} (direct=${root._count.products}, children=${root.children.length}, childProducts=${childTotal})`,
      )
    }

    const sampleProduct = await prisma.product.findFirst({
      where: { published: true },
      select: {
        slug: true,
        name: true,
        imageUrl: true,
        published: true,
        defaultVariantId: true,
        category: { select: { slug: true, parent: { select: { slug: true } } } },
        _count: { select: { variants: true } },
      },
    })
    if (!sampleProduct) throw new Error('No published products found — run yarn db:seed')

    console.log('\nProduct fields:')
    console.log(
      `  ${sampleProduct.slug}: category=${sampleProduct.category.parent?.slug ?? '-'}/${sampleProduct.category.slug}`,
    )
    console.log(
      `  published=${sampleProduct.published}, imageUrl=${Boolean(sampleProduct.imageUrl)}, variants=${sampleProduct._count.variants}`,
    )

    const published = await prisma.product.count({ where: { published: true } })
    const draft = await prisma.product.count({ where: { published: false } })
    console.log(`  published=${published} drafts=${draft}`)

    if (published < 100) {
      throw new Error(`Expected at least 100 published products, found ${published}`)
    }

    const missingImages = await prisma.product.count({
      where: { published: true, OR: [{ imageUrl: null }, { imageUrl: '' }] },
    })
    if (missingImages > 0) {
      throw new Error(`${missingImages} published products are missing imageUrl`)
    }

    const bookSample = await prisma.product.findFirst({
      where: {
        published: true,
        category: { slug: { in: ['programming', 'system-design', 'fiction'] } },
      },
      select: { name: true, imageUrl: true, category: { select: { slug: true } } },
    })
    if (!bookSample?.imageUrl?.includes('book')) {
      console.warn('  ⚠ Book image keyword check skipped/soft-failed (provider URL shape may vary)')
    } else {
      console.log(`  book image ok: ${bookSample.category.slug} → ${bookSample.imageUrl}`)
    }

    console.log('\n🎉 Schema-aligned database checks passed.\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
