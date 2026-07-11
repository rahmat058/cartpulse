import { NextResponse } from 'next/server'
import { listCategoryTree } from '@/lib/services/categories'

export async function GET() {
  try {
    const categories = await listCategoryTree()
    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('Category list failed:', error)
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}
