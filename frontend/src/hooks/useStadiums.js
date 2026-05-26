import { useEffect, useState } from 'react'
import { stadiumService } from '../services/stadiumService'
import { unwrapData } from '../utils/apiData'

/**
 * Fetches all stadiums once on mount and returns the list.
 * Shared by HomePage and SearchResultsPage.
 */
export function useStadiums() {
  const [stadiums, setStadiums] = useState([])

  useEffect(() => {
    stadiumService
      .getAll()
      .then(res => {
        const payload = unwrapData(res)
        if (Array.isArray(payload)) setStadiums(payload)
        else if (payload && Array.isArray(payload.data)) setStadiums(payload.data)
      })
      .catch(() => {})
  }, [])

  return stadiums
}
