'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrdersChart, RevenueChart } from '@/components/dashboard/AnalyticsDashboard'

export interface OverviewAnalyticsData {
  series: Array<{ date: string; revenue: number; orders: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  totalRevenue: number
  totalOrders: number
}

const EMPTY: OverviewAnalyticsData = {
  series: [],
  topProducts: [],
  totalRevenue: 0,
  totalOrders: 0,
}

export function AdminOverviewCharts({ initialData }: { initialData?: OverviewAnalyticsData }) {
  const [range, setRange] = useState('30')
  const [data, setData] = useState<OverviewAnalyticsData>(initialData ?? EMPTY)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData && range === '30') {
      setData(initialData)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/analytics?days=${range}`)
      .then((response) => response.json())
      .then((json: { data: OverviewAnalyticsData }) => {
        if (!cancelled) setData(json.data ?? EMPTY)
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [range, initialData])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Performance</h2>
          <p className="text-muted-foreground text-sm">Revenue and order trends over time</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                range === days
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/25'
                  : 'border-border bg-background text-muted-foreground border hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/40',
              )}>
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className={cn('grid gap-4 lg:grid-cols-2', loading && 'opacity-60')}>
        <div className="bg-card rounded-md border border-teal-100/80 p-4 shadow-sm dark:border-teal-900/40">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Revenue</p>
              <p className="text-muted-foreground text-xs">${data.totalRevenue.toFixed(2)} in selected period</p>
            </div>
          </div>
          <RevenueChart data={data.series} />
        </div>

        <div className="bg-card rounded-md border border-cyan-100/80 p-4 shadow-sm dark:border-cyan-900/40">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Orders</p>
              <p className="text-muted-foreground text-xs">{data.totalOrders} orders in selected period</p>
            </div>
          </div>
          <OrdersChart data={data.series} />
        </div>
      </div>
    </section>
  )
}
