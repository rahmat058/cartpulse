'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface AnalyticsData {
  series: Array<{ date: string; revenue: number; orders: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  totalRevenue: number
  totalOrders: number
}

const axisTick = { fontSize: 11, fill: 'currentColor' }
const tooltipStyle = {
  backgroundColor: 'var(--card, #fff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 8,
  color: 'inherit',
}

export function RevenueChart({ data }: { data: AnalyticsData['series'] }) {
  return (
    <div className="h-72 w-full text-slate-500 dark:text-slate-400">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
          <XAxis dataKey="date" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} name="Revenue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OrdersChart({ data }: { data: AnalyticsData['series'] }) {
  return (
    <div className="h-72 w-full text-slate-500 dark:text-slate-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
          <XAxis dataKey="date" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="orders" fill="#0891b2" name="Orders" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState('30')
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetch(`/api/admin/analytics?days=${range}`)
      .then((r) => r.json())
      .then((json: { data: AnalyticsData }) => setData(json.data))
  }, [range])

  if (!data) return <p className="text-sm text-slate-500">Loading analytics…</p>

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {['7', '30', '90'].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => setRange(days)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              range === days ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Last {days} days
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-sm font-medium">Revenue</p>
          <RevenueChart data={data.series} />
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-sm font-medium">Orders over time</p>
          <OrdersChart data={data.series} />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-semibold">Top products</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2">Product</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((product) => (
              <tr key={product.name} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2">{product.name}</td>
                <td className="py-2">{product.quantity}</td>
                <td className="py-2 text-right">${product.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
