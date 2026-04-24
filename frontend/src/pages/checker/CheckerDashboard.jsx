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
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [stats, setStats] = useState({ total_tickets: 0, checked_in_tickets: 0, not_checked_in_tickets: 0 })

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await matchService.getAll({ limit: 30 })
        const payload = unwrapData(response)
        const list = payload?.data ?? payload ?? []
        setMatches(list)
        if (list[0]?.id) setSelectedMatchId(String(list[0].id))
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
                onChange={(event) => setSelectedMatchId(event.target.value)}
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
            <div className="premium-stats-grid">
              <div className="stat-card-premium total">
                <div className="stat-icon-bg"><Users size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Total Tickets</span>
                  <h2 className="stat-value">{stats.total_tickets.toLocaleString()}</h2>
                </div>
              </div>
              
              <div className="stat-card-premium checked">
                <div className="stat-icon-bg"><CheckCircle2 size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Checked-in</span>
                  <h2 className="stat-value">{stats.checked_in_tickets.toLocaleString()}</h2>
                </div>
              </div>

              <div className="stat-card-premium remaining">
                <div className="stat-icon-bg"><XCircle size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Remaining</span>
                  <h2 className="stat-value">{stats.not_checked_in_tickets.toLocaleString()}</h2>
                </div>
              </div>

              <div className="stat-card-premium ratio">
                <div className="stat-icon-bg"><BarChart3 size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Attendance Rate</span>
                  <h2 className="stat-value">{checkinRatio}%</h2>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${checkinRatio}%` }}></div>
                </div>
              </div>
            </div>

            <div className="checker-actions-grid">
              <Link to="/checker/scan" className="action-card scan full-width">
                <div className="action-icon"><QrCode size={32} /></div>
                <div className="action-text">
                  <h3>Launch QR Scanner</h3>
                  <p>Validate ticket codes and grant entry access to the venue</p>
                </div>
                <ChevronRight className="action-arrow" />
              </Link>
            </div>

            <div className="stand-analytics-section">
              <div className="section-header-premium">
                <LayoutGrid size={20} className="text-blue-500" />
                <h2>Stand Occupancy Analytics</h2>
              </div>
              
              <div className="stands-grid-premium">
                {stats.stands?.map((stand) => {
                  const fillRate = stand.sold_tickets > 0 
                    ? Math.round((stand.checked_in_tickets / stand.sold_tickets) * 100) 
                    : 0;
                  
                  return (
                    <div key={stand.stand_name} className="stand-stat-card">
                      <div className="stand-card-header">
                        <span className="stand-tag">Stand {stand.stand_name}</span>
                        <span className={`rate-badge ${fillRate > 80 ? 'high' : fillRate > 40 ? 'mid' : 'low'}`}>
                          {fillRate}% In
                        </span>
                      </div>
                      
                      <div className="stand-metrics">
                        <div className="s-metric">
                          <span className="s-label">Sold</span>
                          <span className="s-value">{stand.sold_tickets}</span>
                        </div>
                        <div className="s-metric">
                          <span className="s-label">Checked-in</span>
                          <span className="s-value highlight">{stand.checked_in_tickets}</span>
                        </div>
                      </div>

                      <div className="stand-progress-wrap">
                        <div className="stand-progress-bg">
                          <div 
                            className={`stand-progress-fill ${fillRate > 80 ? 'bg-green-500' : fillRate > 40 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                            style={{ width: `${fillRate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] mt-2 font-bold text-slate-400 uppercase">
                          <span>Arrivals</span>
                          <span>{stand.checked_in_tickets}/{stand.sold_tickets}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
