import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import MatchCard from '../../components/ui/MatchCard'
import SportsBanner from '../../components/ui/SportsBanner'
import { matchService } from '../../services/matchService'
import { unwrapData } from '../../utils/apiData'

export default function SportPage() {
  const { sportId } = useParams()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Schedule calendar state
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true)
      try {
        const response = await matchService.getAll({ sport_id: sportId, limit: 100 })
        const payload = unwrapData(response)
        let items = []
        if (Array.isArray(payload)) items = payload
        else if (payload && Array.isArray(payload.data)) items = payload.data
        setMatches(items)
      } catch {
        setMatches([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [sportId])

  // Filter matches by selected month/year for schedule
  const scheduleMatches = useMemo(() => {
    return matches
      .filter(m => {
        if (!m.match_date) return false
        const d = new Date(m.match_date)
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
      })
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
  }, [matches, selectedMonth, selectedYear])

  // Group schedule matches by date
  const groupedSchedule = useMemo(() => {
    const groups = {}
    scheduleMatches.forEach(m => {
      const dateKey = new Date(m.match_date).toLocaleDateString('en-US', { weekday: 'long', month: '2-digit', day: '2-digit', year: 'numeric' })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(m)
    })
    return groups
  }, [scheduleMatches])

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i)

  return (
    <section className="container page" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: 0 }}>

      {/* ============ LỊCH THI ĐẤU ============ */}
      <section className="schedule-section" style={{ marginTop: '24px' }}>
        <div className="schedule-header">
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>MATCH SCHEDULE</h2>
            <p className="section-subtitle" style={{ marginTop: '4px' }}>View matches by month</p>
          </div>
          <div className="schedule-filters">
            <div className="schedule-select-wrap">
              <label>Month</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="schedule-select"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div className="schedule-select-wrap">
              <label>Year</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="schedule-select"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="loading-state" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading match schedule...</p>
        ) : scheduleMatches.length === 0 ? (
          <div className="schedule-empty">
            <span className="schedule-empty-icon">📅</span>
            <p>No matches found</p>
          </div>
        ) : (
          <div className="schedule-timeline">
            {Object.entries(groupedSchedule).map(([dateStr, dayMatches]) => (
              <div key={dateStr} className="schedule-day-group">
                <div className="schedule-day-label">
                  <div className="schedule-day-dot"></div>
                  <span>{dateStr}</span>
                </div>
                <div className="schedule-day-matches">
                  {dayMatches.map(match => {
                    const matchTime = new Date(match.match_date)
                    const timeStr = matchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                    const isPast = matchTime < new Date()

                    const CardWrapper = isPast ? 'div' : Link
                    const cardProps = isPast
                      ? {
                          onClick: () => toast.error('Ticket sales have ended!'),
                          style: { opacity: 0.6, cursor: 'not-allowed' }
                        }
                      : { to: `/audience/matches/${match.id}/seats` }

                    return (
                      <CardWrapper
                        key={match.id}
                        className="schedule-match-card"
                        {...cardProps}
                      >
                        <div className="smc-time">
                          <span className="smc-time-value">{timeStr}</span>
                        </div>
                        <div className="smc-divider"></div>
                        <div className="smc-teams-info">
                          <div className="smc-team-row">
                            <div className="smc-team-logo">{match.home_team.substring(0, 3).toUpperCase()}</div>
                            <span className="smc-team-name">{match.home_team}</span>
                          </div>
                          <span className="smc-vs">VS</span>
                          <div className="smc-team-row">
                            <div className="smc-team-logo">{match.away_team.substring(0, 3).toUpperCase()}</div>
                            <span className="smc-team-name">{match.away_team}</span>
                          </div>
                        </div>
                        <div className="smc-meta">
                          <span className="smc-stadium">🏟️ {match.stadium_name || 'Stadium'}</span>
                          {isPast ? (
                            <span className="smc-status smc-status-ended">Sales Ended</span>
                          ) : (
                            <span className="smc-status smc-status-upcoming">Upcoming</span>
                          )}
                        </div>
                        <div className="smc-arrow">→</div>
                      </CardWrapper>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </section>
  )
}
