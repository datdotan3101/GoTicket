import { useState, useMemo, useEffect } from 'react'

export function usePagination(items, itemsPerPage = 6, resetDependency = null) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to first page when the reset dependency changes
  useEffect(() => {
    setCurrentPage(1)
  }, [resetDependency])

  const paginatedItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return []
    const start = (currentPage - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    if (!items || !Array.isArray(items)) return 0
    return Math.ceil(items.length / itemsPerPage)
  }, [items, itemsPerPage])

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages
  }
}
