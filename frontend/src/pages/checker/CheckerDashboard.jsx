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
              <h1>Checker Workspace</h1>
            </div>
            
            <div className="match-selector-card">
              <div className="selector-label">
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

      <main className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="checker-actions-grid" style={{ marginBottom: '32px' }}>
          <Link to="/checker/scan" className="action-card scan full-width" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-600))', color: 'var(--color-white)', border: 'none' }}>
            <div className="action-icon" style={{ background: 'rgba(255,255,255,0.2)' }}><QrCode size={32} /></div>
            <div className="action-text">
              <h3 style={{ color: 'var(--color-white)' }}>Launch QR Scanner</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>Validate ticket codes and grant entry access to the venue</p>
            </div>
            <ChevronRight className="action-arrow" style={{ color: 'var(--color-white)' }} />
          </Link>
        </div>

            <div className="stats-grid">
              <div className="stat-card" style={{ color: 'var(--color-primary-600)' }}>
                <div className="stat-icon-wrap" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-600)' }}>
                  <Users size={24} />
                </div>
                <span className="stat-label">Total Tickets</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-slate-900)' }}>{stats.total_tickets.toLocaleString()}</h2>
              </div>
              
              <div className="stat-card" style={{ color: 'var(--color-success)' }}>
                <div className="stat-icon-wrap" style={{ background: '#dcfce7', color: '#166534' }}>
                  <CheckCircle2 size={24} />
                </div>
                <span className="stat-label">Checked-in</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-slate-900)' }}>{stats.checked_in_tickets.toLocaleString()}</h2>
              </div>

              <div className="stat-card" style={{ color: 'var(--color-danger)' }}>
                <div className="stat-icon-wrap" style={{ background: 'var(--color-danger-light)', color: '#991b1b' }}>
                  <XCircle size={24} />
                </div>
                <span className="stat-label">Remaining</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-slate-900)' }}>{stats.not_checked_in_tickets.toLocaleString()}</h2>
              </div>

              <div className="stat-card" style={{ color: '#8b5cf6' }}>
                <div className="stat-icon-wrap" style={{ background: '#f3e8ff', color: '#5b21b6' }}>
                  <BarChart3 size={24} />
                </div>
                <span className="stat-label">Attendance Rate</span>
                <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-slate-900)' }}>{checkinRatio}%</h2>
                <div className="progress-container" style={{ marginTop: 'auto' }}>
                  <div className="progress-bar" style={{ width: `${checkinRatio}%`, background: '#8b5cf6' }}></div>
                </div>
              </div>
            </div>

      </main>
    </div>
  )
}
