import { Link } from 'react-router-dom'
import { isMatchHot } from '../../utils/hotBadge'
import { formatDateTime } from '../../utils/formatDate'
import { formatVND } from '../../utils/formatCurrency'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

export default function MatchCard({ match, showHotBadge = false }) {
  const soldCount = Number(match.sold_count || 0)
  const totalSeats = Number(match.total_seats || 0)
  const isHot = isMatchHot(soldCount, totalSeats)

  const matchId = parseInt(match.id, 10) || 0
  const imgUrl = match.thumbnail_url || DUMMY_IMAGES[matchId % DUMMY_IMAGES.length]

  return (
    <Link to={`/audience/matches/${match.id}/seats`} className="match-card-link">
      <article className="match-card" style={{ border: '1px solid #cbd5e1', position: 'relative' }}>
        {/* HOT badge in top-right */}
        {showHotBadge && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 900,
            padding: '4px 12px',
            borderRadius: '8px',
            zIndex: 10,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🔥 HOT
          </div>
        )}

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
      </article>
    </Link>
  )
}

