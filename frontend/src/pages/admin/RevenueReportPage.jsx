import { useEffect, useState, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { DollarSign, Ticket, TrendingUp, Trophy, Activity } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatters'

const EMPTY_DATA = {
  bySport: [],
  topMatches: []
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

export default function RevenueReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await dashboardService.getAdminRevenue()
        const payload = unwrapData(response)
        
        setData(payload || EMPTY_DATA)
      } catch {
        setData(EMPTY_DATA)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  const { totalRevenue, totalTickets } = useMemo(() => {
    if (!data || !data.bySport) return { totalRevenue: 0, totalTickets: 0 }
    return data.bySport.reduce((acc, curr) => ({
      totalRevenue: acc.totalRevenue + Number(curr.revenue),
      totalTickets: acc.totalTickets + Number(curr.tickets)
    }), { totalRevenue: 0, totalTickets: 0 })
  }, [data])

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading revenue analytics...</p>
      </div>
    )
  }

  if (!data) return <div style={{ padding: '100px 0', textAlign: 'center' }}>No report available.</div>

  const bySport = data.bySport || []
  const topMatches = data.topMatches || []

  const pieData = bySport.map(s => ({
    name: s.sport_name,
    value: Number(s.revenue)
  }))

  const barData = topMatches.map(m => ({
    name: `${m.home_team?.substring(0,3).toUpperCase() || 'TBA'} v ${m.away_team?.substring(0,3).toUpperCase() || 'TBA'}`,
    revenue: Number(m.revenue) / 1000000 // Convert to millions for better display
  }))

  return (
    <section className="container manager-dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '32px' }}>
        <div className="dashboard-header-left">
          <div className="checker-badge" style={{ background: '#e0e7ff', color: '#4f46e5', marginBottom: '12px', display: 'inline-flex', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, alignItems: 'center', gap: '6px' }}>
            <Activity size={14} />
            <span>Financial Overview</span>
          </div>
          <h1 className="dashboard-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>Revenue Report</h1>
          <p className="dashboard-subtitle">Monitor platform-wide revenue and sales performance</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="stat-card" style={{ color: '#4f46e5', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="stat-icon-wrap" style={{ background: '#e0e7ff' }}>
            <DollarSign size={24} />
          </div>
          <span className="stat-label">Total Revenue</span>
          <h2 className="stat-value">{formatVND(totalRevenue)}</h2>
          <div className="stat-trend up" style={{ color: '#10b981' }}>
            <TrendingUp size={12} />
            <span>Platform lifetime</span>
          </div>
        </div>

        <div className="stat-card" style={{ color: '#0891b2', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="stat-icon-wrap" style={{ background: '#cffafe' }}>
            <Ticket size={24} />
          </div>
          <span className="stat-label">Total Tickets Sold</span>
          <h2 className="stat-value">{totalTickets.toLocaleString()}</h2>
          <div className="stat-trend up" style={{ color: '#10b981' }}>
            <TrendingUp size={12} />
            <span>Platform lifetime</span>
          </div>
        </div>

        <div className="stat-card" style={{ color: '#b45309', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="stat-icon-wrap" style={{ background: '#fef3c7' }}>
            <Trophy size={24} />
          </div>
          <span className="stat-label">Top Matches</span>
          <h2 className="stat-value">{topMatches.length}</h2>
          <span className="dashboard-subtitle" style={{ fontSize: '0.75rem' }}>Currently trending</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Pie Chart: Revenue by Sport */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', color: '#0f172a' }}>Revenue Distribution</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatVND(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Top Matches */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', color: '#0f172a' }}>Top Earning Matches</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value}M`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} width={120} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}M VND`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 4, 4, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Sport Details */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Sport Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bySport.map((sport, index) => (
              <div key={sport.sport_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{sport.sport_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatVND(sport.revenue)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{Number(sport.tickets).toLocaleString()} tickets</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Matches Details */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Match Performances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topMatches.map((match) => (
              <div key={match.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  {match.home_team} <span style={{ color: '#94a3b8', fontWeight: 400, margin: '0 4px' }}>vs</span> {match.away_team}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    <Ticket size={14} />
                    {Number(match.tickets_sold).toLocaleString()} sold
                  </div>
                  <div style={{ fontWeight: 800, color: '#10b981' }}>
                    {formatVND(match.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
