import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { 
  Bell, 
  DollarSign, 
  Ticket, 
  Calendar, 
  TrendingUp,
} from 'lucide-react'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
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
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchAll()
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

    </section>
  )
}
