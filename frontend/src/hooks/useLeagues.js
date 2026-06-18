import { useEffect, useState } from 'react'
import { leagueService } from '../services/leagueService'
import { unwrapData } from '../utils/apiData'

/**
 * Fetches all leagues once on mount and returns the list.
 */
export function useLeagues() {
  const [leagues, setLeagues] = useState([])

  useEffect(() => {
    leagueService
      .getAll()
      .then(res => {
        const payload = unwrapData(res)
        if (Array.isArray(payload)) setLeagues(payload)
        else if (payload && Array.isArray(payload.data)) setLeagues(payload.data)
      })
      .catch(() => {})
  }, [])

  return leagues
}
