import { useEffect, useState } from 'react'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'

export default function RevenueReportPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await dashboardService.getAdminRevenue()
        setData(unwrapData(response))
      } catch {
        setData(null)
      }
    }

    fetchReport()
  }, [])

  if (!data) return <section className="container page"><p>No report.</p></section>

  return (
    <section className="container page">
      <h1>Revenue Report</h1>
      <h2>By sport</h2>
      <div className="cards-grid">
        {(data.bySport || []).map((sport) => (
          <article key={sport.sport_id} className="card">
            <h3>{sport.sport_name}</h3>
            <p>Revenue: {formatVND(sport.revenue)}</p>
            <p>Tickets: {sport.tickets}</p>
          </article>
        ))}
      </div>
      <h2 style={{ marginTop: '12px' }}>Top matches</h2>
      <div className="cards-grid">
        {(data.topMatches || []).map((match) => (
          <article key={match.id} className="card">
            <h3>{match.home_team} vs {match.away_team}</h3>
            <p>Revenue: {formatVND(match.revenue)}</p>
            <p>Sold: {match.tickets_sold}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
