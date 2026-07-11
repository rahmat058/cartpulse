'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface StoreSettings {
  id: string
  slug: string
  name: string
  supportEmail: string | null
  currency: string
  taxRate: number
  shippingFlat: number
  freeShippingThreshold: number
}

export function AdminSettingsPage() {
  const [stores, setStores] = useState<StoreSettings[]>([])
  const [selected, setSelected] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then((json: { data: StoreSettings[] }) => {
        setStores(json.data)
        setSelected(json.data[0] ?? null)
      })
  }, [])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) return
    setLoading(true)

    const response = await fetch(`/api/admin/stores/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: selected.name,
        supportEmail: selected.supportEmail,
        currency: selected.currency,
        taxRate: selected.taxRate,
        shippingFlat: selected.shippingFlat,
        freeShippingThreshold: selected.freeShippingThreshold,
      }),
    })

    setLoading(false)
    if (!response.ok) {
      toast.error('Failed to save settings')
      return
    }
    toast.success('Settings saved')
  }

  if (!selected) return <p className="text-sm text-slate-500">Loading settings…</p>

  return (
    <Card>
      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div>
          <label htmlFor="storeSelect" className="mb-1 block text-sm font-medium">
            Store
          </label>
          <select
            id="storeSelect"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={selected.id}
            onChange={(e) => setSelected(stores.find((s) => s.id === e.target.value) ?? null)}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="storeName" className="mb-1 block text-sm font-medium">
            Store name
          </label>
          <Input
            id="storeName"
            value={selected.name}
            onChange={(e) => setSelected({ ...selected, name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="supportEmail" className="mb-1 block text-sm font-medium">
            Support email
          </label>
          <Input
            id="supportEmail"
            type="email"
            value={selected.supportEmail ?? ''}
            onChange={(e) => setSelected({ ...selected, supportEmail: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium">
            Currency
          </label>
          <Input
            id="currency"
            value={selected.currency}
            onChange={(e) => setSelected({ ...selected, currency: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="taxRate" className="mb-1 block text-sm font-medium">
              Tax rate
            </label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={selected.taxRate}
              onChange={(e) => setSelected({ ...selected, taxRate: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-slate-500">e.g. 0.08 = 8%</p>
          </div>
          <div>
            <label htmlFor="shippingFlat" className="mb-1 block text-sm font-medium">
              Shipping flat ($)
            </label>
            <Input
              id="shippingFlat"
              type="number"
              min="0"
              step="0.01"
              value={selected.shippingFlat}
              onChange={(e) => setSelected({ ...selected, shippingFlat: Number(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="freeShip" className="mb-1 block text-sm font-medium">
              Free shipping at ($)
            </label>
            <Input
              id="freeShip"
              type="number"
              min="0"
              step="0.01"
              value={selected.freeShippingThreshold}
              onChange={(e) =>
                setSelected({ ...selected, freeShippingThreshold: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <Button type="submit" loading={loading}>
          Save settings
        </Button>
      </form>
    </Card>
  )
}
