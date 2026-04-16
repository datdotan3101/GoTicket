import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MatchCard from '../../components/ui/MatchCard'
import SportsBanner from '../../components/ui/SportsBanner'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function SportPage() {
  const { sportId } = useParams()
  const [matches, setMatches] = useState([])

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ sport_id: sportId, limit: 20 })
        const payload = unwrapData(response)
        setMatches(payload?.data ?? payload ?? [])
      } catch {
        setMatches([])
      }
    }

    fetchMatches()
  }, [sportId])

  return (
    <section className="container page">
      <SportsBanner title={`Sport ${sportId}`} />
      <div className="cards-grid">
        {matches.map((match) => <MatchCard key={match.id} match={match} />)}
      </div>
    </section>
  )
}
