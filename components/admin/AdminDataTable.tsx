'use client'

import { cn } from '@/lib/utils'
import { useMemo, useState, type ReactNode } from 'react'
import type { ColumnDef, PaginationState, RowSelectionState, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, MoreVertical, Search } from 'lucide-react'
import { NoResultsPanel } from '@/components/lottie/NoResultsPanel'
import { AdminDataTableSkeletonBody } from '@/components/admin/AdminDataTableSkeleton'
import { usePagination } from '@/hooks/use-pagination'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'

export type AdminRowAction<T> = {
  label: string
  onClick: (row: T) => void
  destructive?: boolean
}

type AdminDataTableProps<TData extends { id: string }> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: ReactNode
  toolbarAction?: ReactNode
  enableRowSelection?: boolean
  enableSorting?: boolean
  manualPagination?: boolean
  pageCount?: number
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  rowActions?: (row: TData) => AdminRowAction<TData>[]
  className?: string
}

export function AdminDataTable<TData extends { id: string }>({
  columns,
  data,
  loading,
  error,
  emptyMessage = 'No results found.',
  searchPlaceholder = 'Search…',
  searchValue = '',
  onSearchChange,
  filters,
  toolbarAction,
  enableRowSelection = true,
  enableSorting = true,
  manualPagination = false,
  pageCount: pageCountProp,
  total,
  page,
  pageSize: pageSizeProp = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  rowActions,
  className,
}: AdminDataTableProps<TData>) {
  const [internalSearch, setInternalSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSizeProp,
  })

  const search = onSearchChange ? searchValue : internalSearch
  const setSearch = onSearchChange ?? setInternalSearch

  const isServerPagination = manualPagination || (onPageChange != null && total != null)

  const pageCount = pageCountProp ?? (total != null ? Math.max(1, Math.ceil(total / pageSizeProp)) : undefined)

  const pagination: PaginationState = isServerPagination
    ? { pageIndex: Math.max(0, (page ?? 1) - 1), pageSize: pageSizeProp }
    : internalPagination

  const tableColumns = useMemo(() => {
    const defs: ColumnDef<TData, unknown>[] = []

    if (enableRowSelection) {
      defs.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? true : false)}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
      })
    }

    defs.push(...columns)

    if (rowActions) {
      defs.push({
        id: 'actions',
        header: () => (
          <span className="text-muted-foreground block text-right text-xs font-semibold tracking-wide uppercase">
            Actions
          </span>
        ),
        cell: ({ row }) => {
          const actions = rowActions(row.original)
          if (actions.length === 0) return null

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
                      aria-label="Row actions">
                      <MoreVertical />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" sideOffset={6} className="min-w-44 rounded-md p-1.5">
                  {actions.map((action, index) => {
                    const firstDestructiveIndex = actions.findIndex((item) => item.destructive)

                    return (
                      <div key={action.label}>
                        {index === firstDestructiveIndex && firstDestructiveIndex > 0 ? (
                          <DropdownMenuSeparator />
                        ) : null}
                        <DropdownMenuItem
                          variant={action.destructive ? 'destructive' : 'default'}
                          className="cursor-pointer rounded-md px-2.5 py-2"
                          onClick={() => action.onClick(row.original)}>
                          {action.label}
                        </DropdownMenuItem>
                      </div>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        size: 72,
        enableSorting: false,
      })
    }

    return defs
  }, [columns, enableRowSelection, rowActions])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(!isServerPagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      if (isServerPagination) {
        if (next.pageIndex !== pagination.pageIndex) {
          onPageChange?.(next.pageIndex + 1)
        }
        if (next.pageSize !== pagination.pageSize) {
          onPageSizeChange?.(next.pageSize)
        }
        return
      }
      setInternalPagination(next)
    },
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? pageCount : undefined,
    enableSortingRemoval: false,
    enableRowSelection,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: Math.max(1, table.getPageCount()),
    paginationItemsToDisplay: 5,
  })

  const totalRows = isServerPagination ? (total ?? 0) : data.length
  const from =
    table.getRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * pagination.pageSize + 1
  const to = isServerPagination
    ? Math.min(from + data.length - 1, totalRows)
    : Math.min((table.getState().pagination.pageIndex + 1) * pagination.pageSize, data.length)

  const skeletonColumnIds = useMemo(
    () => tableColumns.map((column) => column.id ?? `col-${String(column.header)}`),
    [tableColumns],
  )

  const skeletonRowCount = pagination.pageSize

  return (
    <div className={cn('space-y-4', className)}>
      {filters ? <div className="flex flex-wrap items-center gap-3">{filters}</div> : null}

      <div className="border-border bg-card flex flex-col overflow-hidden rounded-md border shadow-sm">
        <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              className="h-9 pl-9"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {toolbarAction ? <div className="flex flex-wrap items-center gap-2">{toolbarAction}</div> : null}
        </div>

        {error ? (
          <p className="text-destructive px-4 py-8 text-center text-sm">{error}</p>
        ) : (
          <div className="max-h-[min(32rem,calc(100dvh-17rem))] overflow-auto overscroll-contain">
            <Table containerClassName="overflow-visible">
              <TableHeader className="bg-card/95 [&_tr]:bg-muted/95 sticky top-0 z-10 backdrop-blur-sm [&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-muted/95">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className={cn(
                          'text-muted-foreground h-11 px-4 text-xs font-semibold tracking-wide uppercase',
                          header.id === 'select' && 'w-12 px-3',
                          header.id === 'actions' && 'text-right',
                        )}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                header.column.getToggleSortingHandler()?.(e)
                              }
                            }}
                            tabIndex={0}
                            role="button">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronUpIcon className="size-4 shrink-0 opacity-60" aria-hidden />,
                              desc: <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              {loading ? (
                <AdminDataTableSkeletonBody columnIds={skeletonColumnIds} rowCount={skeletonRowCount} />
              ) : (
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() ? 'selected' : undefined}
                        className="data-[state=selected]:bg-teal-50/70 dark:data-[state=selected]:bg-teal-950/30">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'px-4 py-3',
                              cell.column.id === 'select' && 'w-12 px-3',
                              cell.column.id === 'actions' && 'text-right',
                            )}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={tableColumns.length}
                        className={search.trim() ? 'p-0' : 'text-muted-foreground h-32 text-center text-sm'}>
                        {search.trim() ? (
                          <NoResultsPanel title={emptyMessage} size="sm" className="py-8 sm:py-10" />
                        ) : (
                          emptyMessage
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Table>
          </div>
        )}

        {!loading && !error && (data.length > 0 || isServerPagination) ? (
          <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-3 max-sm:flex-col">
            <p className="text-muted-foreground flex-1 text-sm whitespace-nowrap">
              {isServerPagination ? (
                <>
                  Showing <span className="text-foreground">{from}</span> to{' '}
                  <span className="text-foreground">{to}</span> of <span className="text-foreground">{totalRows}</span>{' '}
                  entries
                </>
              ) : (
                <>
                  Page <span className="text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                  <span className="text-foreground">{table.getPageCount()}</span>
                </>
              )}
            </p>

            <div className="grow">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Go to previous page">
                      <ChevronLeftIcon aria-hidden />
                    </Button>
                  </PaginationItem>

                  {showLeftEllipsis ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}

                  {pages.map((pageNum) => {
                    const isActive = pageNum === table.getState().pagination.pageIndex + 1
                    return (
                      <PaginationItem key={pageNum}>
                        <Button
                          size="icon"
                          variant={isActive ? 'default' : 'outline'}
                          onClick={() => table.setPageIndex(pageNum - 1)}
                          aria-current={isActive ? 'page' : undefined}>
                          {pageNum}
                        </Button>
                      </PaginationItem>
                    )
                  })}

                  {showRightEllipsis ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}

                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Go to next page">
                      <ChevronRightIcon aria-hidden />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            <div className="flex flex-1 justify-end">
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}>
                <SelectTrigger className="h-9 w-fit whitespace-nowrap" aria-label="Results per page">
                  <SelectValue>{`${table.getState().pagination.pageSize} / page`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
