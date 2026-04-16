import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'

export default function ManagerDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await dashboardService.getManagerRevenue()
        setData(unwrapData(response))
      } catch {
        setData(null)
      }
    }

    fetchRevenue()
  }, [])

  return (
    <section className="container page">
      <h1>Manager Dashboard</h1>
      <div className="row-gap">
        <Link className="link-button" to={APP_ROUTES.MANAGER_MATCH_CREATE}>Create match</Link>
        <Link className="link-button" to={APP_ROUTES.MANAGER_NOTIFICATIONS}>Notifications</Link>
      </div>

      {data?.summary && (
        <div className="cards-grid">
          <article className="card"><h3>Total revenue</h3><p>{formatVND(data.summary.total_revenue)}</p></article>
          <article className="card"><h3>Total tickets</h3><p>{data.summary.total_tickets}</p></article>
          <article className="card"><h3>Total matches</h3><p>{data.summary.total_matches}</p></article>
        </div>
      )}

      <h2 style={{ marginTop: '14px' }}>Matches</h2>
      <div className="cards-grid">
        {(data?.byMatch || []).map((match) => (
          <article key={match.match_id} className="card">
            <h3>{match.home_team} vs {match.away_team}</h3>
            <p>Revenue: {formatVND(match.revenue)}</p>
            <p>Tickets sold: {match.tickets_sold}</p>
            <div className="row-gap">
              <Link className="link-button" to={`/manager/matches/${match.match_id}/edit`}>Edit</Link>
              <Link className="link-button" to={`/manager/matches/${match.match_id}/stand-config`}>Stand config</Link>
              <Link className="link-button" to={`/manager/matches/${match.match_id}/analytics`}>Analytics</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
