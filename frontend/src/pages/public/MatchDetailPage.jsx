import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'

export default function MatchDetailPage() {
  const { matchId } = useParams()
  const [match, setMatch] = useState(null)

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const response = await matchService.getById(matchId)
        setMatch(unwrapData(response))
      } catch {
        setMatch(null)
      }
    }

    fetchMatch()
  }, [matchId])

  if (!match) return <section className="container page"><p>Match not found.</p></section>

  return (
    <section className="container page">
      <h1>{match.home_team} vs {match.away_team}</h1>
      <p>{formatDateTime(match.match_date)}</p>
      <p>{match.description || 'No description'}</p>
      <Link className="link-button" to={`/audience/matches/${match.id}/seats`}>Choose seats</Link>
    </section>
  )
}
