import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'

export default function MatchAnalyticsPage() {
  const { matchId } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await dashboardService.getManagerMatchAnalytics(matchId)
        setData(unwrapData(response))
      } catch {
        setData(null)
      }
    }

    fetchAnalytics()
  }, [matchId])

  if (!data) return <section className="container page"><p>No analytics available.</p></section>

  return (
    <section className="container page">
      <h1>Match Analytics</h1>
      <p>{data.match?.home_team} vs {data.match?.away_team}</p>

      <h2>By stand</h2>
      <div className="cards-grid">
        {(data.byStand || []).map((stand) => (
          <article className="card" key={stand.stand_name}>
            <h3>Stand {stand.stand_name}</h3>
            <p>Fill rate: {stand.fill_rate_pct || 0}%</p>
            <p>Sold: {stand.sold}</p>
            <p>Checked in: {stand.checked_in}</p>
            <p>Revenue: {formatVND(stand.revenue)}</p>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: '12px' }}>Checkin stats</h2>
      <p>Total tickets: {data.checkinStats?.total_tickets}</p>
      <p>Paid tickets: {data.checkinStats?.paid_tickets}</p>
      <p>Checked in tickets: {data.checkinStats?.checked_in_tickets}</p>

      <h2 style={{ marginTop: '12px' }}>Peak hours</h2>
      <pre>{JSON.stringify(data.peakHours || [], null, 2)}</pre>
    </section>
  )
}
