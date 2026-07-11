'use client'

import { ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  buildExportFilename,
  exportRowsToCsv,
  exportRowsToXlsx,
  type ExportRow,
} from '@/lib/export/spreadsheet'
import { cn } from '@/lib/utils'

export function TableExportMenu({
  filenameBase,
  page,
  rows,
  sheetName,
  disabled,
  rowCount,
}: {
  filenameBase: string
  page: number
  rows: ExportRow[]
  sheetName?: string
  disabled?: boolean
  rowCount?: number
}) {
  const count = rowCount ?? rows.length

  function handleExport(format: 'csv' | 'xlsx') {
    if (rows.length === 0) {
      toast.error('No rows on this page to export')
      return
    }

    const filename = buildExportFilename(filenameBase, page)

    try {
      if (format === 'csv') {
        exportRowsToCsv(rows, filename)
      } else {
        exportRowsToXlsx(rows, filename, sheetName ?? filenameBase)
      }
      toast.success(`Exported ${rows.length} rows as ${format.toUpperCase()}`)
    } catch {
      toast.error(`Could not export ${format.toUpperCase()} file`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            data-icon="inline-end"
            className={cn(
              'h-9 border-teal-200/80 bg-background px-3 font-semibold text-teal-800 shadow-sm',
              'hover:border-teal-300 hover:bg-teal-50/80 hover:text-teal-900',
              'dark:border-teal-800/60 dark:bg-teal-950/20 dark:text-teal-200 dark:hover:bg-teal-950/40',
            )}
          >
            <FileSpreadsheet className="size-4" />
            Export
            {count > 0 ? (
              <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/60 dark:text-teal-200">
                {count}
              </span>
            ) : null}
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52 rounded-md p-1.5">
        <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Current page · {count} {count === 1 ? 'row' : 'rows'}
        </p>
        <DropdownMenuItem className="cursor-pointer rounded-md px-2.5 py-2" onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="size-4 text-teal-600" />
          Download XLSX
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-md px-2.5 py-2" onClick={() => handleExport('csv')}>
          <FileText className="size-4 text-teal-600" />
          Download CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
