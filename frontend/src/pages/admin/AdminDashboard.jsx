import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatCurrency'

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getAdminRevenue()
        setData(unwrapData(response))
      } catch {
        setData(null)
      }
    }

    fetchData()
  }, [])

  return (
    <section className="container page">
      <h1>Admin Dashboard</h1>
      <div className="row-gap">
        <Link className="link-button" to={APP_ROUTES.ADMIN_APPROVALS}>Approvals</Link>
        <Link className="link-button" to={APP_ROUTES.ADMIN_USERS}>Users</Link>
        <Link className="link-button" to={APP_ROUTES.ADMIN_SPORTS}>Sports</Link>
        <Link className="link-button" to={APP_ROUTES.ADMIN_LEAGUES}>Leagues</Link>
        <Link className="link-button" to={APP_ROUTES.ADMIN_REVENUE_REPORT}>Revenue report</Link>
      </div>

      {data?.summary && (
        <div className="cards-grid" style={{ marginTop: '12px' }}>
          <article className="card"><h3>Total revenue</h3><p>{formatVND(data.summary.total_revenue)}</p></article>
          <article className="card"><h3>Total tickets</h3><p>{data.summary.total_tickets}</p></article>
          <article className="card"><h3>Total buyers</h3><p>{data.summary.total_buyers}</p></article>
          <article className="card"><h3>Total matches</h3><p>{data.summary.total_matches_with_sales}</p></article>
        </div>
      )}
    </section>
  )
}
