type UsePaginationProps = {
  currentPage: number
  totalPages: number
  paginationItemsToDisplay?: number
}

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: UsePaginationProps) {
  const pages: number[] = []
  const half = Math.floor(paginationItemsToDisplay / 2)

  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + paginationItemsToDisplay - 1)

  if (end - start + 1 < paginationItemsToDisplay) {
    start = Math.max(1, end - paginationItemsToDisplay + 1)
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return {
    pages,
    showLeftEllipsis: start > 1,
    showRightEllipsis: end < totalPages,
  }
}
