import { NextResponse } from 'next/server'
import { listStores } from '@/lib/services/stores'

export async function GET() {
  try {
    const stores = await listStores(true)
    return NextResponse.json({ data: stores })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}
