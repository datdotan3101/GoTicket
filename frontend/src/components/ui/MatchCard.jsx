import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isMatchHot } from '../../utils/hotBadge'
import { formatDateTime } from '../../utils/formatDate'
import { X, Calendar, ShoppingCart, Trophy } from 'lucide-react'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

export default function MatchCard({ match, showHotBadge = false }) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [isEndedModalOpen, setIsEndedModalOpen] = useState(false)
  const soldCount = Number(match.sold_count || 0)
  const totalSeats = Number(match.total_seats || 0)
  const isHot = isMatchHot(soldCount, totalSeats)
  const isEnded = match.match_date ? new Date(match.match_date) < new Date() : false
  const isNotYetOpen = match.ticket_sale_open_at ? new Date(match.ticket_sale_open_at) > new Date() : false

  const matchId = parseInt(match.id, 10) || 0
  const imgUrl = match.thumbnail_url || DUMMY_IMAGES[matchId % DUMMY_IMAGES.length]

  const handleClick = (e) => {
    if (isNotYetOpen) {
      e.preventDefault()
      setIsSaleModalOpen(true)
    } else if (isEnded) {
      e.preventDefault()
      setIsEndedModalOpen(true)
    }
  }

  return (
    <>
      <Link to={(isNotYetOpen || isEnded) ? '#' : `/audience/matches/${match.id}/seats`} className="match-card-link" onClick={handleClick}>
        <article className="match-card" style={{ border: '1px solid #cbd5e1', position: 'relative', opacity: isNotYetOpen ? 0.8 : 1 }}>
          {/* Ended badge */}
          {isEnded && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#64748b',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '8px',
              zIndex: 10,
              letterSpacing: '0.5px',
            }}>
              ENDED
            </div>
          )}

          {/* Not yet on sale badge */}
          {!isEnded && isNotYetOpen && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#f97316',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '8px',
              zIndex: 10,
              letterSpacing: '0.5px',
            }}>
              COMING SOON
            </div>
          )}

          {/* HOT badge in top-right */}
          {!isEnded && showHotBadge && (
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

      {isSaleModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setIsSaleModalOpen(false)}>
          <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '32px',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
            animation: 'modalSlideUp 0.3s ease-out'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsSaleModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '72px',
              height: '72px',
              background: '#fff7ed',
              color: '#f97316',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <ShoppingCart size={32} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '12px', color: '#0f172a' }}>
              COMING SOON
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '32px', fontSize: '1rem' }}>
              Tickets for <strong>{match.home_team} vs {match.away_team}</strong> are not yet available for purchase.
            </p>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', color: '#f97316', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Calendar size={14} />
                Sale Opens At
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                {formatDateTime(match.ticket_sale_open_at)}
              </div>
            </div>

            <button
              onClick={() => setIsSaleModalOpen(false)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: '#0f172a',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)'
              }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {isEndedModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setIsEndedModalOpen(false)}>
          <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '32px',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
            animation: 'modalSlideUp 0.3s ease-out'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsEndedModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '72px',
              height: '72px',
              background: '#f1f5f9',
              color: '#64748b',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Trophy size={32} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '12px', color: '#0f172a' }}>
              MATCH ENDED
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '32px', fontSize: '1rem' }}>
              This match has already taken place on <strong>{formatDateTime(match.match_date)}</strong>. Ticket sales are closed.
            </p>

            <button
              onClick={() => setIsEndedModalOpen(false)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: '#64748b',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(100,116,139,0.3)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

