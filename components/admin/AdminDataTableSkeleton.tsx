'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/Table'
import { cn } from '@/lib/utils/cn'

const CELL_WIDTHS = ['w-[92%]', 'w-[68%]', 'w-[54%]', 'w-[78%]', 'w-[44%]', 'w-[86%]']

function SkeletonCell({ columnId, columnIndex }: { columnId: string; columnIndex: number }) {
  if (columnId === 'select') {
    return <Skeleton className="size-4 rounded-sm" />
  }

  if (columnId === 'actions') {
    return <Skeleton className="ml-auto size-8 rounded-md" />
  }

  return <Skeleton className={cn('h-4', CELL_WIDTHS[columnIndex % CELL_WIDTHS.length])} />
}

export function AdminDataTableSkeletonBody({ columnIds, rowCount = 10 }: { columnIds: string[]; rowCount?: number }) {
  return (
    <TableBody aria-busy="true" aria-label="Loading table data">
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`} className="hover:bg-transparent">
          {columnIds.map((columnId, columnIndex) => (
            <TableCell
              key={`${columnId}-${rowIndex}`}
              className={cn('px-4 py-3', columnId === 'select' && 'w-12 px-3', columnId === 'actions' && 'text-right')}>
              <SkeletonCell columnId={columnId} columnIndex={columnIndex} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
