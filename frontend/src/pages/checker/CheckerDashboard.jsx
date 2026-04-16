import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <section className="container page">
      <h1>Checker Dashboard</h1>
      <div className="form">
        <select value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)}>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.home_team} vs {match.away_team}
            </option>
          ))}
        </select>
      </div>

      <div className="cards-grid">
        <article className="card"><h3>Total tickets</h3><p>{stats.total_tickets}</p></article>
        <article className="card"><h3>Checked-in</h3><p>{stats.checked_in_tickets}</p></article>
        <article className="card"><h3>Not checked-in</h3><p>{stats.not_checked_in_tickets}</p></article>
        <article className="card"><h3>Check-in ratio</h3><p>{checkinRatio}%</p></article>
      </div>

      <div className="row-gap" style={{ marginTop: '12px' }}>
        <Link className="link-button" to="/checker/scan">Go to QR scanner</Link>
        {selectedMatchId && (
          <Link className="link-button" to={`/checker/matches/${selectedMatchId}/live-seats`}>
            Open live seat map
          </Link>
        )}
      </div>
    </section>
  )
}
