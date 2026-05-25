import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  QrCode, 
  Users, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Activity,
  ChevronRight,
  Search,
  LayoutGrid
} from 'lucide-react'
import { useSocket } from '../../hooks/useSocket'
import { checkinService } from '../../services/checkinService'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function CheckerDashboard() {
  const socketRef = useSocket({ enabled: true })
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(
    () => localStorage.getItem('checker_selected_match_id') || ''
  )
  const [stats, setStats] = useState({ total_tickets: 0, checked_in_tickets: 0, not_checked_in_tickets: 0 })

  const handleSelectMatch = (id) => {
    setSelectedMatchId(id)
    localStorage.setItem('checker_selected_match_id', id)
  }

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 30 })
        const payload = unwrapData(response)
        const allMatches = payload?.data ?? payload ?? []
        // Only show upcoming or ongoing matches (match_date within last 4 hours or future)
        const now = new Date()
        const list = allMatches.filter(m => {
          if (!m.match_date) return true
          const matchEnd = new Date(new Date(m.match_date).getTime() + 4 * 60 * 60 * 1000)
          return matchEnd > now
        })
        setMatches(list)
        // Only set default if nothing was previously saved
        const saved = localStorage.getItem('checker_selected_match_id')
        const savedExists = saved && list.some(m => String(m.id) === saved)
        if (!savedExists && list[0]?.id) {
          handleSelectMatch(String(list[0].id))
        }
      } catch {
        setMatches([])
      }
    }

    fetchMatches()
  }, [])

  useEffect(() => {
    if (!selectedMatchId) return

    const fetchStats = async () => {
      try {
        const response = await checkinService.getStatsByMatch(selectedMatchId)
        setStats(
          unwrapData(response) || {
            total_tickets: 0,
            checked_in_tickets: 0,
            not_checked_in_tickets: 0,
          },
        )
      } catch {
        setStats({ total_tickets: 0, checked_in_tickets: 0, not_checked_in_tickets: 0 })
      }
    }

    fetchStats()
  }, [selectedMatchId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selectedMatchId) return undefined

    socket.emit('join:match', Number(selectedMatchId))

    const onStats = (payload) => setStats(payload)
    socket.on('checkin:stats', onStats)

    return () => {
      socket.off('checkin:stats', onStats)
    }
  }, [selectedMatchId, socketRef])

  const checkinRatio = useMemo(() => {
    const total = Number(stats.total_tickets || 0)
    if (total === 0) return 0
    return Math.round((Number(stats.checked_in_tickets || 0) / total) * 100)
  }, [stats])

  return (
    <div className="checker-dashboard-premium">
      <div className="checker-header">
        <div className="container">
          <div className="checker-header-inner">
            <div className="checker-title-section">
              <div className="checker-badge">
                <Activity size={14} className="pulse-icon" />
                <span>Live Control</span>
              </div>
              <h1>Checker Workspace</h1>
              <p>Real-time attendance tracking and ticket validation</p>
            </div>
            
            <div className="match-selector-card">
              <div className="selector-label">
                <Search size={16} />
                <span>Select Active Match</span>
              </div>
              <select 
                value={selectedMatchId} 
                onChange={(event) => handleSelectMatch(event.target.value)}
                className="premium-select"
              >
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.home_team} vs {match.away_team}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="container">
        <div className="dashboard-grid">
          <div className="stats-main">
            <div className="checker-actions-grid" style={{ marginBottom: '32px' }}>
              <Link to="/checker/scan" className="action-card scan full-width">
                <div className="action-icon"><QrCode size={32} /></div>
                <div className="action-text">
                  <h3>Launch QR Scanner</h3>
                  <p>Validate ticket codes and grant entry access to the venue</p>
                </div>
                <ChevronRight className="action-arrow" />
              </Link>
            </div>

            <div className="stats-grid">
              <div className="stat-card" style={{ color: '#4f46e5' }}>
                <div className="stat-icon-wrap" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <Users size={24} />
                </div>
                <span className="stat-label">Total Tickets</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{stats.total_tickets.toLocaleString()}</h2>
              </div>
              
              <div className="stat-card" style={{ color: '#10b981' }}>
                <div className="stat-icon-wrap" style={{ background: '#dcfce7', color: '#166534' }}>
                  <CheckCircle2 size={24} />
                </div>
                <span className="stat-label">Checked-in</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{stats.checked_in_tickets.toLocaleString()}</h2>
              </div>

              <div className="stat-card" style={{ color: '#ef4444' }}>
                <div className="stat-icon-wrap" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  <XCircle size={24} />
                </div>
                <span className="stat-label">Remaining</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{stats.not_checked_in_tickets.toLocaleString()}</h2>
              </div>

              <div className="stat-card" style={{ color: '#8b5cf6' }}>
                <div className="stat-icon-wrap" style={{ background: '#f3e8ff', color: '#5b21b6' }}>
                  <BarChart3 size={24} />
                </div>
                <span className="stat-label">Attendance Rate</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{checkinRatio}%</h2>
                <div className="progress-container" style={{ marginTop: 'auto' }}>
                  <div className="progress-bar" style={{ width: `${checkinRatio}%`, background: '#8b5cf6' }}></div>
                </div>
              </div>
            </div>

          </div>

          <aside className="checker-sidebar">
            <div className="sidebar-card">
              <h3>System Guidelines</h3>
              <ul className="guideline-list">
                <li>
                  <span className="dot yellow"></span>
                  <p>Verify identity if ticket category requires ID</p>
                </li>
                <li>
                  <span className="dot blue"></span>
                  <p>Each QR code is valid for single entry only</p>
                </li>
                <li>
                  <span className="dot green"></span>
                  <p>Sync status is live via WebSocket connection</p>
                </li>
              </ul>
            </div>
            
            <div className="status-indicator-card">
              <div className="status-pulse"></div>
              <div className="status-text">
                <span className="status-label">Network Status</span>
                <span className="status-value">Connected & Secured</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
