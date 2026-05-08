import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { 
  Plus, 
  Bell, 
  DollarSign, 
  Ticket, 
  Calendar, 
  ChevronRight, 
  BarChart2, 
  Settings, 
  Edit3,
  TrendingUp,
  MapPin,
  Clock,
  X,
  Map,
  Shield,
  FileText
} from 'lucide-react'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { matchService } from '../../services/matchService'
import { stadiumService } from '../../services/stadiumService'
import { notificationService } from '../../services/notificationService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

const MOCK_DATA = {
  summary: {
    total_revenue: 2850000000,
    total_tickets: 42500,
    total_matches: 8
  },
  byMatch: [
    {
      match_id: 101,
      home_team: 'Manchester City',
      away_team: 'Real Madrid',
      match_date: '2026-04-30T20:00:00Z',
      status: 'published',
      stadium_name: 'Etihad Stadium',
      stadium_city: 'Manchester',
      revenue: 850000000,
      tickets_sold: 45000,
      total_seats: 55000,
      stadium_id: 1,
      ticket_sale_open_at: '2026-04-01T10:00:00Z',
      description: 'UEFA Champions League Semi-final first leg.'
    },
    {
      match_id: 102,
      home_team: 'Manchester City',
      away_team: 'Liverpool FC',
      match_date: '2026-04-20T15:00:00Z',
      status: 'published',
      stadium_name: 'Etihad Stadium',
      stadium_city: 'Manchester',
      revenue: 720000000,
      tickets_sold: 48000,
      total_seats: 55000,
      stadium_id: 1
    },
    {
      match_id: 103,
      home_team: 'Manchester City',
      away_team: 'Arsenal FC',
      match_date: '2026-03-15T19:30:00Z',
      status: 'published',
      stadium_name: 'Etihad Stadium',
      stadium_city: 'Manchester',
      revenue: 950000000,
      tickets_sold: 52000,
      total_seats: 55000,
      stadium_id: 1
    }
  ]
}

export default function ManagerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stadiums, setStadiums] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)
  const [editForm, setEditForm] = useState({
    homeTeam: '',
    awayTeam: '',
    matchDate: null,
    ticketSaleOpenAt: null,
    stadiumId: '',
    description: ''
  })

  useEffect(() => {
    fetchAll()
    fetchStadiums()
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll()
      const notifs = unwrapData(res) || []
      setUnreadCount(notifs.filter(n => !n.is_read).length)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const response = await dashboardService.getManagerRevenue()
      const payload = unwrapData(response)
      if (!payload || !payload.byMatch || payload.byMatch.length === 0 || Number(payload.summary?.total_revenue) === 0) {
        setData(MOCK_DATA)
      } else {
        setData(payload)
      }
    } catch {
      setData(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }

  const fetchStadiums = async () => {
    try {
      const res = await stadiumService.getAll()
      setStadiums(unwrapData(res) || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenEdit = (match) => {
    setEditingMatch(match)
    setEditForm({
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      matchDate: match.match_date ? new Date(match.match_date) : null,
      ticketSaleOpenAt: match.ticket_sale_open_at ? new Date(match.ticket_sale_open_at) : null,
      stadiumId: match.stadium_id || '',
      description: match.description || ''
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateMatch = async (e) => {
    e.preventDefault()
    try {
      await matchService.update(editingMatch.match_id, {
        homeTeam: editForm.homeTeam,
        awayTeam: editForm.awayTeam,
        matchDate: editForm.matchDate,
        ticketSaleOpenAt: editForm.ticketSaleOpenAt,
        stadiumId: Number(editForm.stadiumId),
        description: editForm.description
      })
      toast.success('Match updated successfully')
      setIsEditModalOpen(false)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
    }
  }

  const handleSubmitForReview = async () => {
    try {
      await matchService.submit(editingMatch.match_id)
      toast.success('Submitted for approval')
      setIsEditModalOpen(false)
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submit failed')
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading manager analytics...</p>
      </div>
    )
  }

  return (
    <section className="container manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Manager Portal</h1>
          <p className="dashboard-subtitle">Track your matches performance and manage ticket sales</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link className="mc-btn mc-btn-ghost" to={APP_ROUTES.MANAGER_NOTIFICATIONS} style={{ position: 'relative' }}>
            <Bell size={18} style={{ marginRight: '8px' }} />
            Notifications
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid #fff'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {data?.summary && (
        <div className="stats-grid">
          {(() => {
            const matches = data?.byMatch || []
            const latest = matches[0]
            const previous = matches[1]
            
            const getGrowth = (currentVal, previousVal) => {
              if (!previousVal || previousVal === 0) return null
              return (((currentVal - previousVal) / previousVal) * 100).toFixed(1)
            }

            const revGrowth = latest && previous ? getGrowth(Number(latest.revenue), Number(previous.revenue)) : null
            const tickGrowth = latest && previous ? getGrowth(Number(latest.tickets_sold), Number(previous.tickets_sold)) : null

            return (
              <>
                <div className="stat-card" style={{ color: '#4f46e5' }}>
                  <div className="stat-icon-wrap" style={{ background: '#e0e7ff' }}>
                    <DollarSign size={24} />
                  </div>
                  <span className="stat-label">Total Revenue</span>
                  <h2 className="stat-value">{formatVND(data.summary.total_revenue)}</h2>
                  {revGrowth !== null ? (
                    <div className={`stat-trend ${revGrowth >= 0 ? 'up' : 'down'}`} style={{ color: revGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                      {revGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                      <span>{Math.abs(revGrowth)}% vs last match</span>
                    </div>
                  ) : (
                    <div className="stat-trend up">
                      <TrendingUp size={12} />
                      <span>Live tracking</span>
                    </div>
                  )}
                </div>

                <div className="stat-card" style={{ color: '#0891b2' }}>
                  <div className="stat-icon-wrap" style={{ background: '#cffafe' }}>
                    <Ticket size={24} />
                  </div>
                  <span className="stat-label">Tickets Sold</span>
                  <h2 className="stat-value">{data.summary.total_tickets.toLocaleString()}</h2>
                  {tickGrowth !== null ? (
                    <div className={`stat-trend ${tickGrowth >= 0 ? 'up' : 'down'}`} style={{ color: tickGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                      {tickGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                      <span>{Math.abs(tickGrowth)}% vs last match</span>
                    </div>
                  ) : (
                    <div className="stat-trend up">
                      <TrendingUp size={12} />
                      <span>Real-time update</span>
                    </div>
                  )}
                </div>
              </>
            )
          })()}

          <div className="stat-card" style={{ color: '#b45309' }}>
            <div className="stat-icon-wrap" style={{ background: '#fef3c7' }}>
              <Calendar size={24} />
            </div>
            <span className="stat-label">Total Matches</span>
            <h2 className="stat-value">{data.summary.total_matches}</h2>
            <span className="dashboard-subtitle" style={{ fontSize: '0.75rem' }}>Active campaigns</span>
          </div>
        </div>
      )}

      <div className="dashboard-section-head">
        <h2 className="dashboard-section-title">Match Campaigns</h2>
      </div>

      <div className="manager-match-grid">
        {(data?.byMatch || []).map((match) => (
          <article key={match.match_id} className="manager-match-card" style={{ position: 'relative' }}>
            {new Date(match.match_date) < new Date() ? (
              <span className="status-badge end" style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                zIndex: 1,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                The End
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
                Publishing
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
                <span className={`status-badge ${match.status === 'published' ? 'published' : match.status === 'approved' ? 'approved' : 'draft'}`}>
                  {match.status}
                </span>
              </div>
            </div>

            <div className="mmc-footer">
              <button className="mmc-btn" onClick={() => handleOpenEdit(match)}>
                <Edit3 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                Edit
              </button>
              <Link className="mmc-btn" to={`/manager/matches/${match.match_id}/stand-config`}>
                <Settings size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                Stands
              </Link>
              <Link className="mmc-btn mmc-btn-primary" to={`/manager/matches/${match.match_id}/analytics`}>
                <BarChart2 size={14} style={{ marginBottom: '4px', display: 'block', margin: '0 auto 4px' }} />
                Analytics
              </Link>
            </div>
          </article>
        ))}

        {(!data?.byMatch || data.byMatch.length === 0) && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
            <Calendar size={48} color="#cbd5e1" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No matches found</h3>
            <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Start by creating your first match campaign.</p>
            <Link className="mc-btn mc-btn-primary" to={APP_ROUTES.MANAGER_MATCH_CREATE} style={{ display: 'inline-flex' }}>
              <Plus size={18} style={{ marginRight: '8px' }} />
              Create First Match
            </Link>
          </div>
        )}
      </div>

      {/* Edit Match Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Match Campaign</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateMatch}>
              <div className="modal-body">
                <div className="mc-details-grid">
                  <div className="mc-input-group">
                    <label>HOME TEAM</label>
                    <input 
                      className="mc-nice-input" 
                      value={editForm.homeTeam} 
                      onChange={e => setEditForm(p => ({ ...p, homeTeam: e.target.value }))} 
                      required 
                    />
                  </div>
                  <div className="mc-input-group">
                    <label>AWAY TEAM</label>
                    <input 
                      className="mc-nice-input" 
                      value={editForm.awayTeam} 
                      onChange={e => setEditForm(p => ({ ...p, awayTeam: e.target.value }))} 
                      required 
                    />
                  </div>
                </div>

                <div className="mc-details-grid">
                  <div className="mc-input-group">
                    <label>MATCH DATE & TIME</label>
                    <DatePicker
                      selected={editForm.matchDate}
                      onChange={date => setEditForm(p => ({ ...p, matchDate: date }))}
                      showTimeSelect
                      dateFormat="Pp"
                      className="mc-nice-input"
                      required
                    />
                  </div>
                  <div className="mc-input-group">
                    <label>TICKET SALE START</label>
                    <DatePicker
                      selected={editForm.ticketSaleOpenAt}
                      onChange={date => setEditForm(p => ({ ...p, ticketSaleOpenAt: date }))}
                      showTimeSelect
                      dateFormat="Pp"
                      className="mc-nice-input"
                    />
                  </div>
                </div>

                <div className="mc-input-group" style={{ marginBottom: '20px' }}>
                  <label>STADIUM VENUE</label>
                  <select 
                    className="mc-nice-input" 
                    value={editForm.stadiumId} 
                    onChange={e => setEditForm(p => ({ ...p, stadiumId: e.target.value }))}
                    required
                  >
                    <option value="">Select stadium</option>
                    {stadiums.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.city}</option>
                    ))}
                  </select>
                </div>

                <div className="mc-input-group">
                  <label>MATCH DESCRIPTION</label>
                  <textarea 
                    className="mc-nice-input" 
                    rows={4} 
                    value={editForm.description} 
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <div style={{ marginRight: 'auto' }}>
                  {editingMatch?.status === 'draft' && (
                    <button type="button" className="mc-btn mc-btn-secondary" onClick={handleSubmitForReview}>
                      <Shield size={16} style={{ marginRight: '8px' }} />
                      Submit for Review
                    </button>
                  )}
                </div>
                <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="mc-btn mc-btn-primary">
                  <FileText size={16} style={{ marginRight: '8px' }} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
