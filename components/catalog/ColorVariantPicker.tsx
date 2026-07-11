'use client'

import type { ProductVariant, ProductVariantType } from '@/lib/types/cart'
import { cn } from '@/lib/utils/cn'

interface ColorVariantPickerProps {
  variants: ProductVariant[]
  variantType?: ProductVariantType
  selectedId: string
  onChange: (variantId: string) => void
}

export function ColorVariantPicker({
  variants,
  variantType = 'COLOR',
  selectedId,
  onChange,
}: ColorVariantPickerProps) {
  const isColorVariant = variantType === 'COLOR'

  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const selected = variant.id === selectedId

        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onChange(variant.id)}
            title={variant.color}
            className={cn(
              'group relative flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all',
              selected
                ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm'
                : 'border-slate-200 bg-white/80 text-slate-600 hover:border-teal-300',
            )}
          >
            {isColorVariant ? (
              <span
                className={cn(
                  'h-4 w-4 rounded-full border shadow-inner',
                  selected ? 'border-teal-400' : 'border-slate-200',
                )}
                style={{ backgroundColor: variant.hex }}
              />
            ) : null}
            {variant.color}
          </button>
        )
      })}
    </div>
  )
}
