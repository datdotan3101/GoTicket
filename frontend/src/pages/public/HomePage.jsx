import { useEffect, useState } from 'react'
import MatchCard from '../../components/ui/MatchCard'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function HomePage() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 8, status: 'published' })
        const payload = unwrapData(response)
        setMatches(payload?.data ?? payload ?? [])
      } catch {
        setMatches([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  return (
    <section className="container page">
      <h1>GoTicket Home</h1>
      <p>Browse upcoming sports events and book tickets online.</p>
      {isLoading && <p>Loading matches...</p>}
      <div className="cards-grid">
        {matches.map((match) => <MatchCard key={match.id} match={match} />)}
      </div>
      {!isLoading && matches.length === 0 && <p>No published matches yet.</p>}
    </section>
  )
}
