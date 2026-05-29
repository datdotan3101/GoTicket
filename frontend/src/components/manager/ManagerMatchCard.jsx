import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Map, Edit3, Settings, BarChart2, Trash2, ShoppingCart } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'
import { formatVND } from '../../utils/formatters'

export default function ManagerMatchCard({ match, onOpenEdit, onDelete }) {
  const isEnded = new Date(match.match_date) < new Date()

  return (
    <article className="manager-match-card" style={{ position: 'relative' }}>
      {isEnded ? (
        <span className="status-badge end" style={{ 
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          zIndex: 1,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          The End
        </span>
      ) : match.status === 'pending_review' ? (
        <span className="status-badge" style={{ 
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          zIndex: 1,
          background: '#f59e0b',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          Pending
        </span>
      ) : (
        <span className="status-badge approved" style={{ 
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          zIndex: 1,
          background: '#10b981',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          {match.status === 'published' ? 'Published' : 'Approved'}
        </span>
      )}
      <div className="mmc-head">
        <div className="mmc-teams">
          <span className="mmc-team-name">{match.home_team}</span>
          <span className="mmc-vs">vs</span>
          <span className="mmc-team-name">{match.away_team}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Calendar size={14} />
            <span>{formatDateTime(match.match_date, 'dd/MM/yyyy')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Clock size={14} />
            <span>{match.match_date ? new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
          </div>
        </div>
        {match.ticket_sale_open_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316', fontSize: '0.7rem', fontWeight: 700, marginTop: '8px', background: '#fff7ed', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ffedd5', width: 'fit-content' }}>
            <ShoppingCart size={12} style={{ marginBottom: '-1px' }} />
            <span>SALE OPENS: {formatDateTime(match.ticket_sale_open_at)}</span>
          </div>
        )}
      </div>
      
      <div className="mmc-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '0.85rem', fontWeight: 700 }}>
            <MapPin size={16} color="#ef4444" />
            <span>{match.stadium_name || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, paddingLeft: '24px' }}>
            <Map size={14} color="#94a3b8" />
            <span>{match.stadium_city || 'N/A'}</span>
          </div>
        </div>

        <div className="mmc-metric-row">
          <div className="mmc-metric">
            <span className="mmc-metric-label">Revenue Generated</span>
            <span className="mmc-metric-value" style={{ color: '#16a34a' }}>{formatVND(match.revenue)}</span>
          </div>
          <div className="mmc-metric">
            <span className="mmc-metric-label">Tickets Sold</span>
            <span className="mmc-metric-value">{match.tickets_sold}</span>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`status-badge ${['published', 'approved'].includes(match.status) ? 'approved' : match.status === 'rejected' ? 'rejected' : 'draft'}`}>
            {match.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mmc-footer">
        {!['approved', 'published'].includes(match.status) && (
          <>
            <button 
              className="mmc-btn" 
              onClick={() => onOpenEdit(match)}
            >
              <Edit3 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
              Edit
            </button>
            <Link className="mmc-btn" to={`/manager/matches/${match.match_id}/stand-config`}>
              <Settings size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
              Stands
            </Link>
          </>
        )}
        <Link className="mmc-btn mmc-btn-primary" to={`/manager/matches/${match.match_id}/analytics`} style={{ flex: ['approved', 'published'].includes(match.status) ? 1 : 'unset' }}>
          <BarChart2 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
          Analytics
        </Link>
        {['draft', 'pending_review', 'rejected'].includes(match.status) && (
          <button 
            className="mmc-btn" 
            onClick={() => onDelete(match.match_id)}
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
            Delete
          </button>
        )}
      </div>
    </article>
  )
}
