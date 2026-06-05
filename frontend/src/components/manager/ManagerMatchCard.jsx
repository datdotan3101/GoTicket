import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Map, Edit3, Settings, BarChart2, Trash2, ShoppingCart } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'
import { formatVND } from '../../utils/formatters'
import { getValidImageUrl } from '../../utils/imageUtils'
import KebabMenu from '../../components/ui/KebabMenu'

const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32fc3e6ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508344928928-7137b29de218?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
]

export default function ManagerMatchCard({ match, onOpenEdit, onDelete }) {
  const isEnded = new Date(match.match_date) < new Date()
  const matchId = parseInt(match.match_id || match.id, 10) || 0
  const imgUrl = match.thumbnail_url || DUMMY_IMAGES[matchId % DUMMY_IMAGES.length]

  const isEditable = !['approved', 'published'].includes(match.status);
  const isDeletable = ['draft', 'pending_review', 'rejected'].includes(match.status);

  const menuItems = [];
  if (isEditable) {
    menuItems.push({
      label: 'Stands',
      icon: <Settings size={16} />,
      to: `/manager/matches/${match.match_id}/stand-config`
    });
  }
  menuItems.push({
    label: 'Analytics',
    icon: <BarChart2 size={16} />,
    to: `/manager/matches/${match.match_id}/analytics`
  });

  return (
    <article className="match-card manager-match-card-override" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isEnded ? (
        <span className="status-badge end" style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          zIndex: 20,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          The End
        </span>
      ) : match.status === 'pending_review' ? (
        <span className="status-badge" style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          zIndex: 20,
          background: 'var(--color-warning)',
          color: 'var(--color-white)',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          Pending
        </span>
      ) : (
        <span className="status-badge approved" style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          zIndex: 20,
          background: 'var(--color-success)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          {match.status === 'published' ? 'Published' : 'Approved'}
        </span>
      )}

      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20 }}>
        <KebabMenu 
          variant="glass" 
          onEdit={isEditable ? () => onOpenEdit(match) : undefined} 
          onDelete={isDeletable ? () => onDelete(match.match_id) : undefined} 
          customItems={menuItems} 
        />
      </div>
      <div className="mc-image" style={{ backgroundImage: `url(${imgUrl})` }}>
        <div className="mc-image-overlay"></div>
        <div className="mc-teams">
          <div className="mc-team">
            <div className="mc-logo">
              {getValidImageUrl(match.home_team_logo) ? (
                <img src={getValidImageUrl(match.home_team_logo)} alt={match.home_team} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
              ) : (
                match.home_team?.substring(0, 3).toUpperCase()
              )}
            </div>
            <span className="mc-team-name">{match.home_team}</span>
          </div>
          <div className="mc-vs">VS</div>
          <div className="mc-team">
            <div className="mc-logo">
              {getValidImageUrl(match.away_team_logo) ? (
                <img src={getValidImageUrl(match.away_team_logo)} alt={match.away_team} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
              ) : (
                match.away_team?.substring(0, 3).toUpperCase()
              )}
            </div>
            <span className="mc-team-name">{match.away_team}</span>
          </div>
        </div>
      </div>

      <div className="mc-body" style={{ flex: 1, paddingBottom: '16px', paddingTop: '0' }}>
        <div className="mc-info">
          <div className="mc-info-row">
            <Calendar size={14} color="var(--color-slate-500)" className="mc-icon" />
            <span>{formatDateTime(match.match_date)}</span>
          </div>
          {match.ticket_sale_open_at && (
            <div className="mc-info-row">
              <ShoppingCart size={14} color="var(--color-warning)" className="mc-icon" />
              <span style={{ color: '#b45309', fontWeight: 600 }}>Sale opens: {formatDateTime(match.ticket_sale_open_at)}</span>
            </div>
          )}
          <div className="mc-info-row">
            <MapPin size={14} color="var(--color-slate-500)" className="mc-icon" />
            <span>{match.stadium_name || 'Grand Arena'}</span>
          </div>
        </div>

        <div className="mmc-metric-row" style={{ marginTop: '20px', borderTop: '1px solid var(--color-slate-100)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div className="mmc-metric">
            <span className="mmc-metric-label" style={{ fontSize: '0.65rem', color: 'var(--color-slate-400)', fontWeight: 800, textTransform: 'uppercase' }}>Revenue Generated</span>
            <span className="mmc-metric-value" style={{ color: '#16a34a', fontSize: '1rem', fontWeight: 900 }}>{formatVND(match.revenue)}</span>
          </div>
          <div className="mmc-metric">
            <span className="mmc-metric-label" style={{ fontSize: '0.65rem', color: 'var(--color-slate-400)', fontWeight: 800, textTransform: 'uppercase' }}>Tickets Sold</span>
            <span className="mmc-metric-value" style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--color-slate-800)' }}>{match.tickets_sold}</span>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`status-badge ${['published', 'approved'].includes(match.status) ? 'approved' : match.status === 'rejected' ? 'rejected' : 'draft'}`}>
            {match.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
    </article>
  )
}
