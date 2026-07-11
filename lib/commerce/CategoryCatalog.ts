import type { CategoryTreeNode } from '@/lib/services/categories'

export interface CategoryNode {
  slug: string
  label: string
  emoji: string
  href: string
  subcategories: Array<{ label: string; href: string; slug: string; children?: Array<{ label: string; href: string; slug: string }> }>
  promo?: { title: string; description: string; cta: string }
}

function mapSubcategories(node: CategoryTreeNode) {
  return node.children.map((child) => ({
    slug: child.slug,
    label: child.name,
    href: `/products?category=${child.slug}`,
    children: child.children.map((leaf) => ({
      slug: leaf.slug,
      label: leaf.name,
      href: `/products?category=${leaf.slug}`,
    })),
  }))
}

/** Maps API category tree into mega-menu shape (server or client). */
export class CategoryCatalog {
  static fromTree(tree: CategoryTreeNode[]): CategoryNode[] {
    return tree.map((node) => ({
      slug: node.slug,
      label: node.name,
      emoji: node.emoji ?? '📦',
      href: `/products?category=${node.slug}`,
      subcategories: mapSubcategories(node),
      promo: {
        title: `Explore ${node.name}`,
        description: `${node.productCount} products · Verified sellers · Fast delivery.`,
        cta: `Shop ${node.name}`,
      },
    }))
  }

  static getFallback(): CategoryNode[] {
    return [
      {
        slug: 'electronics-gadget',
        label: 'Electronics & Gadget',
        emoji: '💻',
        href: '/products?category=electronics-gadget',
        subcategories: [],
      },
      {
        slug: 'personal-care',
        label: 'Personal Care',
        emoji: '🧴',
        href: '/products?category=personal-care',
        subcategories: [],
      },
      {
        slug: 'appliances',
        label: 'Appliances',
        emoji: '🔌',
        href: '/products?category=appliances',
        subcategories: [],
      },
      {
        slug: 'kitchen-dining',
        label: 'Kitchen & Dining',
        emoji: '🍽️',
        href: '/products?category=kitchen-dining',
        subcategories: [],
      },
      {
        slug: 'food-grocery',
        label: 'Food & Grocery',
        emoji: '🛒',
        href: '/products?category=food-grocery',
        subcategories: [],
      },
      {
        slug: 'fashion',
        label: 'Fashion',
        emoji: '👕',
        href: '/products?category=fashion',
        subcategories: [],
      },
      {
        slug: 'automobiles-helmets',
        label: 'Automobiles & Helmets',
        emoji: '🏍️',
        href: '/products?category=automobiles-helmets',
        subcategories: [],
      },
      {
        slug: 'health-care',
        label: 'Health Care',
        emoji: '❤️',
        href: '/products?category=health-care',
        subcategories: [],
      },
    ]
  }
}
