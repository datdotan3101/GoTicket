import { useCallback, useState } from 'react'
import { matchService } from '../services/matchService'
import { unwrapData } from '../utils/apiData'

/**
 * Reusable hook that wraps the common "call matchService.getAll ➜ unwrap ➜ return items + count" pattern.
 *
 * Returns:
 *  - searchMatches(params)  — trigger the search
 *  - results                — the current result array
 *  - totalCount             — total number of matches returned
 *  - isLoading              — whether a request is in flight
 */
export function useMatchSearch() {
  const [results, setResults] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const searchMatches = useCallback(async (params) => {
    setIsLoading(true)
    try {
      const response = await matchService.getAll(params)
      const payload = unwrapData(response)
      let items = []
      let total = 0
      if (Array.isArray(payload)) {
        items = payload
        total = payload.length
      } else if (payload && Array.isArray(payload.data)) {
        items = payload.data
        total = payload.total ?? payload.data.length
      }
      setResults(items)
      setTotalCount(total)
      return items
    } catch {
      setResults([])
      setTotalCount(0)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setTotalCount(0)
  }, [])

  return { searchMatches, clearResults, results, totalCount, isLoading }
}
