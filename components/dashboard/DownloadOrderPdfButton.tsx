'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function DownloadOrderPdfButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/pdf`)

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `order-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Could not download order PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      loading={loading}
      onClick={handleDownload}
      data-icon="inline-start"
      className={cn(
        'h-9 border-transparent bg-linear-to-r from-teal-500 via-teal-600 to-cyan-500 px-4 font-semibold text-white shadow-md shadow-teal-500/25',
        'hover:from-teal-600 hover:via-teal-700 hover:to-cyan-600',
        'focus-visible:ring-teal-500/40',
      )}
    >
      {!loading ? <FileDown className="size-4" /> : null}
      {loading ? 'Preparing PDF…' : 'Export PDF'}
    </Button>
  )
}
