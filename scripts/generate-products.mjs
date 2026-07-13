import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../data/products.json')

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function categoryImage(categorySlug, lock) {
  const pools = {
    'electronics-gadget': [
      'photo-1505740420928-5e560c06d30e',
      'photo-1523275335684-37898b6baf30',
      'photo-1511707171634-5f897ff02aa9',
      'photo-1498049794561-7780e7231661',
      'photo-1546868871-7041f2a55e12',
      'photo-1484704849700-f032a568e944',
      'photo-1587829741301-dc798b83add3',
      'photo-1593640408182-31c70c8268f5',
      'photo-1526170375885-4d8ecf77b99f',
      'photo-1572569511254-d8f925fe2cbb',
      'photo-1606220945770-b5b6c2c55bf1',
      'photo-1517336714731-489689fd1ca8',
    ],
    'personal-care': [
      'photo-1556228578-0d85b1a4d571',
      'photo-1596462502278-27bfdc403348',
      'photo-1522335789203-aabd1fc54bc9',
      'photo-1631214524020-7e18db9a8f92',
      'photo-1611930022073-b7a4ba5fcccd',
      'photo-1570172619644-dfd03ed5d881',
      'photo-1512496015851-a90fb38ba796',
      'photo-1598440947619-2c35fc9aa908',
      'photo-1608571423902-eed4a5ad8108',
    ],
    appliances: [
      'photo-1556910103-1c02745aae4d',
      'photo-1556909114-f6e7ad7d3136',
      'photo-1585515320310-259814833e62',
      'photo-1585659722983-3a675dabf23d',
      'photo-1590794056226-79ef3a8147e1',
      'photo-1570222094114-d054a817e56b',
      'photo-1556911220-bff31c812dba',
      'photo-1600585152220-90363fe7e115',
    ],
    'kitchen-dining': [
      'photo-1556911220-bff31c812dba',
      'photo-1556909114-f6e7ad7d3136',
      'photo-1600585152220-90363fe7e115',
      'photo-1578749556568-bc2c40e68b61',
      'photo-1490645935967-10de6ba17061',
      'photo-1504674900247-0877df9cc836',
      'photo-1565299624946-b28f40a0ae38',
      'photo-1546548970-71785318a17b',
    ],
    'food-grocery': [
      'photo-1542838132-92c53300491e',
      'photo-1610832958506-aa56368176cf',
      'photo-1586201375761-83865001e31c',
      'photo-1516594798947-e65505dbb29d',
      'photo-1567306301408-9b74779a11af',
      'photo-1509440159596-0249088772ff',
      'photo-1546069901-ba9599a7e63c',
      'photo-1512621776951-a57141f2eefd',
      'photo-1490818387583-1baba5e638af',
    ],
    fashion: [
      'photo-1445205170230-053b83016050',
      'photo-1515886657613-9f3515b0c78f',
      'photo-1490481651871-ab68de25d43d',
      'photo-1469334031218-e382a71b716b',
      'photo-1551028719-00167b16eac5',
      'photo-1542272604-787c3835535d',
      'photo-1549298916-b41d501d3772',
      'photo-1487222477894-8943e31ef7b2',
      'photo-1434389677669-e08b4cac3105',
      'photo-1523381210434-271e8be1f52b',
    ],
    'automobiles-helmets': [
      'photo-1558981403-c5f9899a28bc',
      'photo-1558618666-fcd25c85cd64',
      'photo-1609630875171-b1321377ee65',
      'photo-1568772585407-9361f9bf3a87',
      'photo-1552519507-da3b142c6e3d',
      'photo-1492144534655-ae79c964c9d7',
      'photo-1503376780353-7e6692767b70',
      'photo-1486006920555-c77dcf18193c',
    ],
    'health-care': [
      'photo-1576091160399-112ba8d25d1d',
      'photo-1584308666744-24d5c474f2ae',
      'photo-1579154204601-01588f351e67',
      'photo-1530497610245-94d3c16cda28',
      'photo-1607619056574-7b8d3ee536b2',
      'photo-1581595220892-b0739db3b8c5',
      'photo-1579684385127-1ef15d508118',
      'photo-1631815588090-d4bfec5b1ccb',
      'photo-1582719471384-894fbb16e074',
    ],
  }

  const pool = pools[categorySlug] || pools['electronics-gadget']
  const photoId = pool[(Math.max(1, Number(lock)) - 1) % pool.length]
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=800&q=80`
}

const stores = [
  {
    slug: 'cartpulse',
    name: 'CartPulse Official Store',
    description: 'Flagship marketplace picks across electronics, fashion, and everyday essentials.',
    supportEmail: 'support@cartpulse.com',
    logoEmoji: '🛍️',
    currency: 'USD',
    taxRate: 0.08,
    shippingFlat: 5.99,
    freeShippingThreshold: 75,
    verified: true,
  },
  {
    slug: 'tech-hub',
    name: 'Tech Hub',
    description: 'Gadgets, peripherals, and smart gear from specialist sellers.',
    supportEmail: 'hello@techhub.demo',
    logoEmoji: '💻',
    currency: 'USD',
    taxRate: 0.075,
    shippingFlat: 4.99,
    freeShippingThreshold: 60,
    verified: true,
  },
  {
    slug: 'home-living',
    name: 'Home & Living Co',
    description: 'Appliances, kitchenware, and home comfort products.',
    supportEmail: 'care@homeliving.demo',
    logoEmoji: '🏠',
    currency: 'USD',
    taxRate: 0.06,
    shippingFlat: 6.5,
    freeShippingThreshold: 50,
    verified: true,
  },
  {
    slug: 'beauty-lane',
    name: 'Beauty Lane',
    description: 'Skincare, grooming, and personal care favorites.',
    supportEmail: 'hello@beautylane.demo',
    logoEmoji: '💄',
    currency: 'USD',
    taxRate: 0.07,
    shippingFlat: 4.49,
    freeShippingThreshold: 45,
    verified: false,
  },
  {
    slug: 'fresh-mart',
    name: 'FreshMart Grocery',
    description: 'Pantry staples, snacks, and fresh-market goods.',
    supportEmail: 'orders@freshmart.demo',
    logoEmoji: '🥬',
    currency: 'USD',
    taxRate: 0.05,
    shippingFlat: 7.99,
    freeShippingThreshold: 40,
    verified: true,
  },
  {
    slug: 'moto-gear',
    name: 'MotoGear',
    description: 'Helmets, riding gear, and automotive accessories.',
    supportEmail: 'ride@motogear.demo',
    logoEmoji: '🏍️',
    currency: 'USD',
    taxRate: 0.08,
    shippingFlat: 8.99,
    freeShippingThreshold: 80,
    verified: false,
  },
  {
    slug: 'style-vault',
    name: 'Style Vault',
    description: 'Apparel, footwear, and accessories for every season.',
    supportEmail: 'style@stylevault.demo',
    logoEmoji: '👗',
    currency: 'USD',
    taxRate: 0.07,
    shippingFlat: 5.49,
    freeShippingThreshold: 65,
    verified: true,
  },
  {
    slug: 'wellness-plus',
    name: 'Wellness Plus',
    description: 'Health monitors, supplements, and wellness essentials.',
    supportEmail: 'care@wellnessplus.demo',
    logoEmoji: '💊',
    currency: 'USD',
    taxRate: 0.06,
    shippingFlat: 5.99,
    freeShippingThreshold: 55,
    verified: false,
  },
]

const categories = [
  { slug: 'electronics-gadget', name: 'Electronics & Gadget', emoji: '💻', children: [] },
  { slug: 'personal-care', name: 'Personal Care', emoji: '🧴', children: [] },
  { slug: 'appliances', name: 'Appliances', emoji: '🔌', children: [] },
  { slug: 'kitchen-dining', name: 'Kitchen & Dining', emoji: '🍽️', children: [] },
  { slug: 'food-grocery', name: 'Food & Grocery', emoji: '🛒', children: [] },
  { slug: 'fashion', name: 'Fashion', emoji: '👕', children: [] },
  { slug: 'automobiles-helmets', name: 'Automobiles & Helmets', emoji: '🏍️', children: [] },
  { slug: 'health-care', name: 'Health Care', emoji: '🩺', children: [] },
]

/** Flat category catalogs: 25 products each (200 published total) */
const LEAF_CATALOGS = {
  'electronics-gadget': {
    storeSlugs: ['tech-hub', 'cartpulse', 'tech-hub', 'cartpulse'],
    emoji: '💻',
    imageKeywords: 'gadget,electronics,headphones',
    price: [29, 449],
    withVariants: true,
    variantOnIndices: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
    items: [
      'Sony WH-1000XM5 Wireless Headphones',
      'AirPulse Pro ANC Earbuds',
      'Studio Monitor Headphones Pro',
      'Wireless Neckband Earphones Sport',
      'Desktop Bluetooth Speaker Mini',
      'Over-Ear Travel Headphones Lite',
      'Gaming Headset RGB Surround',
      'Mechanical Keyboard K2 Pro',
      'Low-Profile Wireless Keyboard',
      '4K Webcam Auto-Focus Pro',
      'USB-C Hub 7-in-1 Aluminum',
      'Thunderbolt Dock Mini Station',
      'Portable SSD 1TB USB-C',
      'Smart Watch Fitness Tracker',
      'Tablet Stand Adjustable Aluminum',
      'Noise-Canceling Earbuds Sport',
      'Wireless Charging Pad Fast',
      'LED Ring Light Streaming Kit',
      'Graphics Tablet Drawing Pad',
      'Portable Power Bank 20000mAh',
      'Smart Home Speaker Voice',
      'Ergonomic Mouse Vertical Pro',
      'Dual Monitor Arm Mount',
      'Action Camera 4K Waterproof',
      'Foldable Phone Tripod Stand',
    ],
  },
  'personal-care': {
    storeSlugs: ['beauty-lane', 'wellness-plus', 'beauty-lane', 'cartpulse'],
    emoji: '🧴',
    imageKeywords: 'skincare,cosmetics,beauty',
    price: [8, 89],
    items: [
      'Hydrating Face Cleanser Gel',
      'Vitamin C Brightening Serum',
      'Retinol Night Repair Cream',
      'SPF 50 Daily Sunscreen Lotion',
      'Niacinamide Pore Refining Toner',
      'Hyaluronic Acid Moisture Boost',
      'Charcoal Detox Face Mask',
      'Gentle Micellar Makeup Remover',
      'Coconut Body Butter Rich',
      'Tea Tree Acne Spot Treatment',
      'Argan Oil Hair Repair Serum',
      'Sulfate-Free Shampoo Volume',
      'Conditioning Hair Mask Deep',
      'Electric Toothbrush Sonic Pro',
      'Whitening Toothpaste Enamel Safe',
      'Antiperspirant Deodorant Fresh',
      'Beard Oil Sandalwood Blend',
      'Safety Razor Stainless Classic',
      'Shaving Cream Sensitive Skin',
      'Lip Balm SPF Shea Butter',
      'Hand Cream Shea Recovery',
      'Foot Peel Exfoliating Socks',
      'Bamboo Cotton Swabs Pack',
      'Cotton Rounds Reusable Set',
      'Travel Toiletry Organizer Bag',
    ],
  },
  appliances: {
    storeSlugs: ['home-living', 'cartpulse', 'home-living'],
    emoji: '🔌',
    imageKeywords: 'appliance,kitchen,blender',
    price: [39, 399],
    items: [
      'Countertop Blender 1200W Pro',
      'Air Fryer 6-Quart Digital',
      'Robot Vacuum Smart Mapping',
      'Cordless Stick Vacuum Lite',
      'Steam Iron Ceramic Soleplate',
      'Garment Steamer Handheld',
      'Electric Kettle Temperature Control',
      'Toaster 4-Slice Stainless',
      'Microwave Compact 0.9 Cu Ft',
      'Rice Cooker Fuzzy Logic 10-Cup',
      'Slow Cooker 7-Quart Programmable',
      'Food Processor 14-Cup Deluxe',
      'Stand Mixer 5-Qt Tilt Head',
      'Espresso Machine Pump Driven',
      'Dehumidifier 50-Pint Energy Star',
      'Portable Air Conditioner 10000 BTU',
      'Tower Fan Oscillating Quiet',
      'Space Heater Ceramic Safety',
      'Humidifier Ultrasonic Cool Mist',
      'Water Purifier Pitcher Filter',
      'Electric Pressure Cooker 8-Qt',
      'Induction Cooktop Single Burner',
      'Waffle Maker Belgian Deep',
      'Bread Maker 2-Lb Loaf',
      'Ice Maker Countertop 26 Lbs',
    ],
  },
  'kitchen-dining': {
    storeSlugs: ['home-living', 'fresh-mart', 'home-living'],
    emoji: '🍽️',
    imageKeywords: 'kitchen,dining,cookware',
    price: [12, 189],
    items: [
      'Stainless Chef Knife 8-Inch',
      'Nonstick Saucepan Set 3-Piece',
      'Cast Iron Skillet 12-Inch',
      'Ceramic Dinner Plate Set 12',
      'Wine Glass Stemware Set of 6',
      'Bamboo Cutting Board Large',
      'Silicone Spatula Utensil 5-Pack',
      'Mixing Bowl Set Nesting Steel',
      'French Press Coffee Maker',
      'Pour-Over Dripper Ceramic',
      'Insulated Travel Mug 16oz',
      'Glass Food Storage Containers',
      'Dish Rack Stainless Expandable',
      'Table Runner Linen Natural',
      'Cloth Napkins Cotton 12-Pack',
      'Serving Platter Oval Porcelain',
      'Salad Bowl Wooden Acacia',
      'Steak Knife Set Serrated 6',
      'Measuring Cup Set Stainless',
      'Digital Kitchen Scale Precision',
      'Oven Mitts Silicone Heat Resistant',
      'Spice Rack Wall Mount 20 Jars',
      'Colander Stainless Perforated',
      'Grater Box 4-Sided Stainless',
      'Cocktail Shaker Set Bartender',
    ],
  },
  'food-grocery': {
    storeSlugs: ['fresh-mart', 'cartpulse', 'fresh-mart'],
    emoji: '🛒',
    imageKeywords: 'grocery,food,organic',
    price: [3, 48],
    items: [
      'Organic Rolled Oats 2 lb',
      'Extra Virgin Olive Oil 1L',
      'Almond Butter Creamy 16oz',
      'Whole Grain Pasta Penne 1lb',
      'Jasmine Rice Premium 5 lb',
      'Dark Chocolate Bar 70% Cocoa',
      'Granola Honey Almond Clusters',
      'Cold Brew Coffee Concentrate',
      'Herbal Green Tea 100 Bags',
      'Sparkling Water Lime 12-Pack',
      'Organic Honey Raw 12oz',
      'Peanut Butter Crunchy 18oz',
      'Trail Mix Nut Berry Blend',
      'Canned Chickpeas No Salt 4-Pack',
      'Tomato Sauce Marinara Jar',
      'Gluten-Free Crackers Sea Salt',
      'Protein Bars Chocolate 12-Count',
      'Instant Oatmeal Variety Pack',
      'Maple Syrup Grade A 12oz',
      'Coconut Water Natural 6-Pack',
      'Dried Mango Slices Unsweetened',
      'Quinoa Tri-Color Organic 2 lb',
      'Black Beans Organic 4-Pack',
      'Sourdough Bread Loaf Artisan',
      'Frozen Berry Blend Antioxidant',
    ],
  },
  fashion: {
    storeSlugs: ['style-vault', 'cartpulse', 'style-vault'],
    emoji: '👕',
    imageKeywords: 'fashion,clothing,apparel',
    price: [22, 199],
    withVariants: true,
    variantOnIndices: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22],
    items: [
      'Merino Wool Crewneck Sweater',
      'Everyday Cotton T-Shirt Pack',
      'Linen Resort Button Shirt',
      'Slim Fit Chino Pants',
      'High-Rise Denim Jeans Classic',
      'Performance Running Shorts',
      'Water-Resistant Windbreaker Jacket',
      'Fleece Quarter-Zip Pullover',
      'Relaxed Fit Oxford Shirt',
      'Midi Wrap Dress Floral',
      'Pleated A-Line Skirt',
      'Wool Blend Overcoat Long',
      'Leather Belt Reversible',
      'Canvas Sneakers Low Top',
      'Running Shoes Glide 6',
      'Leather Ankle Boots Chelsea',
      'Crossbody Bag Quilted',
      'Canvas Weekender Tote',
      'Minimal Laptop Backpack',
      'Polarized Aviator Sunglasses',
      'Wool Beanie Rib Knit',
      'Silk Scarf Print Lightweight',
      'Cashmere Touch Gloves Lined',
      'Athletic Socks Cushion 6-Pack',
      'Wide-Brim Sun Hat Straw',
    ],
  },
  'automobiles-helmets': {
    storeSlugs: ['moto-gear', 'tech-hub', 'moto-gear'],
    emoji: '🏍️',
    imageKeywords: 'motorcycle,helmet,auto',
    price: [19, 349],
    items: [
      'Full-Face Motorcycle Helmet DOT',
      'Modular Flip-Up Helmet Matte',
      'Open-Face Cruiser Helmet Vintage',
      'Dual-Sport Adventure Helmet',
      'Bluetooth Helmet Communicator Kit',
      'Anti-Fog Visor Insert Pinlock',
      'Riding Gloves Leather Perforated',
      'Armored Motorcycle Jacket Textile',
      'Riding Jeans Kevlar Lined',
      'Motorcycle Boots Waterproof',
      'Tank Bag Magnetic Mount',
      'Tail Bag Expandable 35L',
      'Phone Mount Handlebar Vibration',
      'Chain Lube Spray High Performance',
      'Tire Pressure Monitor Caps',
      'LED Headlight Bulb H4 Pair',
      'Car Phone Holder Vent Clip',
      'Dash Cam Front 1080p Wide',
      'Jump Starter Portable 1000A',
      'Microfiber Car Wash Mitt',
      'Seat Cover Universal Neoprene',
      'Roof Cargo Bag Waterproof',
      'Emergency Roadside Kit 42-Piece',
      'Motorcycle Cover Outdoor UV',
      'Helmet Carrying Backpack Padded',
    ],
  },
  'health-care': {
    storeSlugs: ['wellness-plus', 'beauty-lane', 'wellness-plus', 'cartpulse'],
    emoji: '🩺',
    imageKeywords: 'health,medical,wellness',
    price: [9, 129],
    items: [
      'Digital Blood Pressure Monitor',
      'Pulse Oximeter Fingertip',
      'Infrared Forehead Thermometer',
      'First Aid Kit 120-Piece Home',
      'Adhesive Bandages Assorted Box',
      'Antiseptic Wipes Individually Wrapped',
      'Reusable Hot Cold Gel Pack',
      'Compression Knee Sleeve Pair',
      'Foam Roller Muscle Recovery',
      'Resistance Bands Set 5 Levels',
      'Yoga Mat Extra Thick Non-Slip',
      'Massage Gun Percussion Lite',
      'Multivitamin Daily 90 Tablets',
      'Omega-3 Fish Oil 120 Softgels',
      'Vitamin D3 5000 IU 180 Count',
      'Probiotic Digestive 60 Capsules',
      'Electrolyte Powder Hydration 30',
      'Protein Powder Whey Vanilla 2lb',
      'Sleep Support Melatonin 5mg',
      'Hand Sanitizer Gel 32oz Pump',
      'Disposable Face Masks 50-Pack',
      'N95 Respirator Masks 10-Pack',
      'Nebulizer Compressor Home Kit',
      'Glucose Monitor Starter Kit',
      'Compression Socks Travel 3-Pair',
    ],
  },
}

const COLORWAYS = [
  { slug: 'midnight-black', color: 'Midnight Black', hex: '#1a1a1a' },
  { slug: 'platinum-silver', color: 'Platinum Silver', hex: '#c0c0c0' },
  { slug: 'ocean-blue', color: 'Ocean Blue', hex: '#2563eb' },
  { slug: 'sage-green', color: 'Sage Green', hex: '#87a878' },
]

function roundPrice(min, max, index) {
  const span = max - min
  const raw = min + (((index * 17) % 100) / 100) * span
  return Math.round(raw * 100) / 100
}

function buildVariants(skuBase, emoji) {
  return COLORWAYS.slice(0, 3).map((tone, index) => ({
    sku: `${skuBase}-${tone.slug.slice(0, 3).toUpperCase()}`,
    slug: tone.slug,
    color: tone.color,
    hex: tone.hex,
    stock: 8 + index * 3,
    emoji,
    isDefault: index === 0,
  }))
}

function pickStoreSlug(config, itemIndex) {
  const slugs = config.storeSlugs ?? [config.storeSlug]
  return slugs[itemIndex % slugs.length]
}

function shouldHaveVariants(config, itemIndex) {
  if (!config.withVariants) return false
  if (config.variantOnIndices) return config.variantOnIndices.includes(itemIndex)
  return true
}

function buildProducts() {
  const products = []
  let skuCounter = 1
  let imageLock = 1

  for (const [categorySlug, config] of Object.entries(LEAF_CATALOGS)) {
    if (config.items.length !== 25) {
      throw new Error(`Category ${categorySlug} must have 25 items, got ${config.items.length}`)
    }

    for (const [itemIndex, name] of config.items.entries()) {
      const slug = slugify(name)
      const skuBase = `PRD${String(skuCounter).padStart(3, '0')}`
      skuCounter += 1

      const base = {
        storeSlug: pickStoreSlug(config, itemIndex),
        slug,
        name,
        category: categorySlug,
        price: roundPrice(config.price[0], config.price[1], itemIndex + skuCounter),
        stock: 12 + ((itemIndex * 5) % 40),
        rating: Math.round((3.9 + (itemIndex % 10) * 0.1) * 10) / 10,
        emoji: config.emoji,
        imageUrl: categoryImage(categorySlug, imageLock++),
        published: true,
        description: `${name} — curated for CartPulse demos in the ${categorySlug.replace(/-/g, ' ')} category.`,
      }

      if (shouldHaveVariants(config, itemIndex)) {
        const variants = buildVariants(skuBase, config.emoji)
        base.variants = variants
        base.defaultVariantSlug = variants[0].slug
        base.stock = variants.reduce((sum, v) => sum + v.stock, 0)
      }

      products.push(base)
    }
  }

  const published = products.filter((p) => p.published !== false)
  if (published.length !== 200) {
    throw new Error(`Expected 200 published products, built ${published.length}`)
  }

  products.push({
    storeSlug: 'tech-hub',
    slug: 'draft-firmware-cable-kit',
    name: 'Draft Firmware Cable Kit',
    category: 'electronics-gadget',
    price: 19.99,
    stock: 5,
    rating: 3.8,
    emoji: '🧪',
    imageUrl: categoryImage('electronics-gadget', imageLock++),
    published: false,
    description: 'Unpublished draft SKU for admin publish/unpublish demos.',
  })

  return products
}

const data = buildProducts()
const published = data.filter((p) => p.published !== false)

const payload = {
  meta: {
    schemaVersion: '3.0.0',
    collection: 'products',
    totalProducts: data.length,
    publishedProducts: published.length,
    totalStores: stores.length,
    categories: categories.map((category) => category.slug),
    leafCategories: Object.keys(LEAF_CATALOGS),
    currency: 'USD',
    generatedAt: new Date().toISOString(),
  },
  stores,
  categories,
  data,
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`)
console.log(
  `Wrote ${stores.length} stores, ${categories.length} categories, ${data.length} products (${published.length} published) → ${outPath}`,
)
console.log('Category slugs:', categories.map((c) => c.slug).join(', '))
