import { Link } from 'react-router-dom'
import { isMatchHot } from '../../utils/hotBadge'
import { formatDateTime } from '../../utils/formatDate'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

export default function MatchCard({ match }) {
  const soldCount = Number(match.sold_count || 0)
  const totalSeats = Number(match.total_seats || 0)
  const isHot = isMatchHot(soldCount, totalSeats)

  // Use modulo for consistent dummy image per match if no actual thumbnail exists
  const imgUrl = match.thumbnail_url || DUMMY_IMAGES[match.id % DUMMY_IMAGES.length]

  return (
    <article className="match-card">
      <div className="mc-image" style={{ backgroundImage: `url(${imgUrl})` }}>
        {isHot && <div className="mc-badge">SELLING FAST</div>}
      </div>
      
      <div className="mc-body">
        <div className="mc-teams">
          <div className="mc-team">
            <div className="mc-logo">{match.home_team.substring(0, 3).toUpperCase()}</div>
            <span className="mc-team-name">{match.home_team}</span>
          </div>
          <div className="mc-vs">VS</div>
          <div className="mc-team">
            <div className="mc-logo">{match.away_team.substring(0, 3).toUpperCase()}</div>
            <span className="mc-team-name">{match.away_team}</span>
          </div>
        </div>

        <div className="mc-info">
          <div className="mc-info-row">
            <span className="mc-icon">📅</span>
            <span>{formatDateTime(match.match_date)}</span>
          </div>
          <div className="mc-info-row">
            <span className="mc-icon">🏟️</span>
            <span>{match.stadium_name || 'Grand Arena, London'}</span>
          </div>
        </div>
      </div>

      <div className="mc-footer">
        <div className="mc-price-col">
          <span className="mc-price-label">STARTING FROM</span>
          {/* Price mocked up for premium showcase UI */}
          <span className="mc-price-val">£145.00</span> 
        </div>
        <Link className="mc-buy-btn" to={`/audience/matches/${match.id}/seats`}>
          Buy Tickets
        </Link>
      </div>
    </article>
  )
}
