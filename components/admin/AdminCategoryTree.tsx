'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, FolderTree, MoreVertical, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AdminCategoryTreeNode } from '@/types/admin'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { NoResultsPanel } from '@/components/lottie/NoResultsPanel'
import { cn } from '@/lib/utils'

const DEPTH_STYLES: Record<number, string> = {
  1: 'bg-card border-border shadow-sm',
  2: 'border-teal-100 bg-teal-50/70 dark:border-teal-900/50 dark:bg-teal-950/25',
  3: 'border-teal-200 bg-teal-100/50 dark:border-teal-800/50 dark:bg-teal-950/40',
}

const DEPTH_ACCENT: Record<number, string> = {
  1: 'border-l-teal-600',
  2: 'border-l-teal-500',
  3: 'border-l-teal-400',
}

const TREE_TRANSITION = {
  height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const },
  opacity: { duration: 0.22, ease: 'easeOut' as const },
}

const CHEVRON_TRANSITION = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }

function CategoryTreeNodeRow({
  node,
  onEdit,
  onDelete,
  onAddChild,
  canDelete,
}: {
  node: AdminCategoryTreeNode
  onEdit: (id: string) => void
  onDelete: (node: AdminCategoryTreeNode) => void
  onAddChild: (parentId: string) => void
  canDelete: boolean
}) {
  const [open, setOpen] = useState(true)
  const reduceMotion = useReducedMotion()
  const hasChildren = node.children.length > 0
  const canAddChild = node.depth < 3
  const depth = Math.min(node.depth, 3)

  return (
    <div className="min-w-0" style={{ marginLeft: `${(node.depth - 1) * 1.25}rem` }}>
      <div
        className={cn(
          'group mb-2 flex min-w-0 items-center gap-1 rounded-md border border-l-4 py-2 pr-2 pl-3 transition-colors hover:brightness-[0.98] dark:hover:brightness-110',
          DEPTH_STYLES[depth],
          DEPTH_ACCENT[depth],
        )}
      >
        <button
          type="button"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/80',
            !hasChildren && 'invisible',
          )}
          aria-expanded={hasChildren ? open : undefined}
          aria-label={open ? 'Collapse' : 'Expand'}
          onClick={() => setOpen((value) => !value)}
        >
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={reduceMotion ? { duration: 0 } : CHEVRON_TRANSITION}
            className="flex items-center justify-center"
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => onEdit(node.id)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/80 text-lg">
            {node.emoji ?? '📦'}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{node.name}</p>
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-teal-200/80 dark:text-teal-300 dark:ring-teal-800/60">
                Level {node.depth}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              /{node.slug}
              <span className="mx-2 text-border">·</span>
              {node.productCount} products
              {node.childCount > 0 ? ` · ${node.childCount} subcategories` : ''}
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
                aria-label="Category actions"
              >
                <MoreVertical />
              </Button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-44 rounded-md p-1.5">
            <DropdownMenuItem className="cursor-pointer rounded-md px-2.5 py-2" onClick={() => onEdit(node.id)}>
              Edit category
            </DropdownMenuItem>
            {canAddChild ? (
              <DropdownMenuItem
                className="cursor-pointer rounded-md px-2.5 py-2"
                onClick={() => onAddChild(node.id)}
              >
                Add subcategory
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer rounded-md px-2.5 py-2"
                  onClick={() => onDelete(node)}
                >
                  Delete category
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren ? (
        <motion.div
          initial={false}
          animate={{
            height: open ? 'auto' : 0,
            opacity: open ? 1 : 0,
          }}
          transition={reduceMotion ? { duration: 0 } : TREE_TRANSITION}
          className="overflow-hidden"
        >
          <div className="space-y-0">
            {node.children.map((child) => (
              <CategoryTreeNodeRow
                key={child.id}
                node={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                canDelete={canDelete}
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

export function AdminCategoryTree({
  tree,
  loading,
  error,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onAddRoot,
  onAddChild,
  canDelete = false,
  canCreate = true,
}: {
  tree: AdminCategoryTreeNode[]
  loading?: boolean
  error?: string | null
  search: string
  onSearchChange: (value: string) => void
  onEdit: (id: string) => void
  onDelete: (node: AdminCategoryTreeNode) => void
  onAddRoot: () => void
  onAddChild: (parentId: string) => void
  canDelete?: boolean
  canCreate?: boolean
}) {
  const filteredTree = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tree

    function filterNodes(nodes: AdminCategoryTreeNode[]): AdminCategoryTreeNode[] {
      return nodes
        .map((node) => {
          const children = filterNodes(node.children)
          const matches =
            node.name.toLowerCase().includes(query) ||
            node.slug.toLowerCase().includes(query) ||
            node.pathLabel.toLowerCase().includes(query)

          if (matches || children.length > 0) {
            return { ...node, children }
          }
          return null
        })
        .filter(Boolean) as AdminCategoryTreeNode[]
    }

    return filterNodes(tree)
  }, [search, tree])

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <FolderTree className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search categories…"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20"
          />
        </div>
        {canCreate ? (
          <Button size="sm" onClick={onAddRoot}>
            <Plus />
            Add top-level category
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-border bg-card ring-1 ring-teal-600/30" />
          Level 1
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-teal-100 bg-teal-50 ring-1 ring-teal-500/30 dark:border-teal-900/50 dark:bg-teal-950/25" />
          Level 2
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-teal-200 bg-teal-100/50 ring-1 ring-teal-400/30 dark:border-teal-800/50 dark:bg-teal-950/40" />
          Level 3
        </span>
      </div>

      {error ? (
        <p className="px-4 py-8 text-center text-sm text-destructive">{error}</p>
      ) : loading ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">Loading categories…</p>
      ) : filteredTree.length === 0 ? (
        search.trim() ? (
          <NoResultsPanel
            title="No categories match your search"
            description="Try a different name, slug, or path."
            size="sm"
            className="py-10"
          />
        ) : (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No categories found. Add a top-level category to start your tree.
          </p>
        )
      ) : (
        <div className="max-h-[min(40rem,calc(100dvh-14rem))] overflow-auto p-4">
          {filteredTree.map((node) => (
            <CategoryTreeNodeRow
              key={node.id}
              node={node}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
