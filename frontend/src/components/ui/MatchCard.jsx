import { Link } from 'react-router-dom'
import { isMatchHot } from '../../utils/hotBadge'
import { formatDateTime } from '../../utils/formatDate'
import CountdownTimer from './CountdownTimer'

export default function MatchCard({ match }) {
  const soldCount = Number(match.sold_count || 0)
  const totalSeats = Number(match.total_seats || 0)

  return (
    <article className="card">
      <h3>{match.home_team} vs {match.away_team}</h3>
      <p>{formatDateTime(match.match_date)}</p>
      <p>Status: {match.status}</p>
      {isMatchHot(soldCount, totalSeats) && <p className="badge-hot">Hot - Nearly sold out</p>}
      <p>
        Sale opens: <CountdownTimer targetDate={match.ticket_sale_open_at} />
      </p>
      <div className="row-gap">
        <Link className="link-button" to={`/matches/${match.id}`}>View detail</Link>
        <Link className="link-button" to={`/audience/matches/${match.id}/seats`}>Choose seats</Link>
      </div>
    </article>
  )
}
