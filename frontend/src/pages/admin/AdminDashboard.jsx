import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Trophy, Medal } from 'lucide-react'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime, formatVND } from '../../utils/formatters'

const COLORS = ['#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EMPTY_DATA = {
  summary: {
    total_revenue: 0,
    total_tickets: 0,
    total_open_matches: 0,
    total_system_seats: 0,
    total_buyers: 0
  },
  growth: {
    today_revenue: 0,
    yesterday_revenue: 0
  },
  topClubs: [],
  revenueTrend: [],
  bySport: [],
  operations: []
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getAdminRevenue()
        const payload = unwrapData(response)
        
        setData(payload || EMPTY_DATA)
      } catch {
        setData(EMPTY_DATA)
      }
    }
    fetchData()
  }, [])

  if (!data) return <div className="container page">Loading dashboard...</div>

  const { summary, bySport, topClubs, revenueTrend, operations, growth } = data

  const fillRate = summary.total_system_seats > 0 
    ? ((summary.total_tickets / summary.total_system_seats) * 100).toFixed(1) 
    : 0

  const growthRate = growth?.yesterday_revenue > 0 
    ? (((growth.today_revenue - growth.yesterday_revenue) / growth.yesterday_revenue) * 100).toFixed(1)
    : 0

  return (
    <section className="container page" style={{ border: 'none', background: 'transparent', paddingBottom: '60px' }}>
      {/* LEVEL 0: Header */}
      <div className="section-head" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-3px', color: '#111827', lineHeight: 0.9, margin: 0 }}>System Overview</h1>
          <p className="section-subtitle" style={{ fontSize: '1.1rem', color: '#6b7280', marginTop: '16px', fontWeight: 500 }}>
            Real-time performance metrics and operational analytics.
          </p>
        </div>
      </div>

      {/* LEVEL 1: Overview KPI */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <article className="card" style={kpiCardStyle}>
          <h3 style={kpiLabelStyle}>Total Revenue</h3>
          <p style={kpiValueStyle}>{formatVND(summary.total_revenue)}</p>
          <span style={{ fontSize: '0.8rem', color: growthRate >= 0 ? '#166534' : '#991b1b', fontWeight: 700 }}>
            {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate)}% vs Yesterday
          </span>
        </article>
        <article className="card" style={kpiCardStyle}>
          <h3 style={kpiLabelStyle}>Tickets Sold</h3>
          <p style={kpiValueStyle}>{summary.total_tickets.toLocaleString()}</p>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Across all categories</span>
        </article>
        <article className="card" style={kpiCardStyle}>
          <h3 style={kpiLabelStyle}>Active Matches</h3>
          <p style={kpiValueStyle}>{summary.total_open_matches}</p>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Currently open for sale</span>
        </article>
        <article className="card" style={kpiCardStyle}>
          <h3 style={kpiLabelStyle}>System Fill Rate</h3>
          <p style={kpiValueStyle}>{fillRate}%</p>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px' }}>
            <div style={{ width: `${fillRate}%`, height: '100%', background: '#1d4ed8', borderRadius: '3px' }} />
          </div>
        </article>
      </div>

      {/* LEVEL 2: Top Performers (Clubs) */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={sectionTitleStyle}>Top 5 Clubs by Revenue</h2>
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '20px', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={thStyle}>Club</th>
                <th style={thStyle}>Revenue</th>
                <th style={thStyle}>Tickets</th>
                <th style={thStyle}>Fill Rate</th>
                <th style={thStyle}>Matches</th>
                <th style={thStyle}>Manager</th>
              </tr>
            </thead>
            <tbody>
              {topClubs.map((club, index) => (
                <tr key={club.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => window.location.href=`/admin/clubs/${club.id}`}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {index === 0 ? <Trophy size={18} color="#eab308" /> : index === 1 ? <Medal size={18} color="#94a3b8" /> : index === 2 ? <Medal size={18} color="#b45309" /> : <span style={{ width: '18px', display: 'inline-block', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>{index + 1}</span>}
                      <strong>{club.name}</strong>
                    </div>
                  </td>
                  <td style={tdStyle}>{formatVND(club.revenue)}</td>
                  <td style={tdStyle}>{club.tickets_sold}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                        <div style={{ width: `${club.fill_rate}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>{Number(club.fill_rate).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{club.matches_count}</td>
                  <td style={tdStyle}>{club.manager_name || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEVEL 3: Analytics */}
      <div className="cards-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="card" style={{ padding: '24px', borderRadius: '20px', border: 'none', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '24px' }}>Revenue Trend (Last 30 Days)</h3>
          <div style={{ width: '100%', height: '300px', minWidth: 0 }}>
            <ResponsiveContainer>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} />
                <YAxis hide />
                <Tooltip formatter={(value) => formatVND(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#1d4ed8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: '24px', borderRadius: '20px', border: 'none', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '24px' }}>Revenue by Sport</h3>
          <div style={{ width: '100%', height: '300px', minWidth: 0 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={bySport} dataKey="revenue" nameKey="sport_name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {bySport.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatVND(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LEVEL 4: Operations Status */}
      <div>
        <h2 style={sectionTitleStyle}>📌 Operations Status</h2>
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Upcoming Matches */}
          <div className="card" style={opCardStyle}>
            <h4 style={opTitleStyle}>Upcoming (Next 7 Days)</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {operations.filter(m => m.status === 'published').slice(0, 3).map(m => (
                <div key={m.id} style={opItemStyle}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{formatDateTime(m.match_date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{((m.sold / m.total_seats) * 100).toFixed(0)}%</div>
                    <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Fill Rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical: Low Fill Rate */}
          <div className="card" style={opCardStyle}>
            <h4 style={{ ...opTitleStyle, color: '#991b1b' }}>Low Fill Rate (&lt;30%)</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {operations.filter(m => m.status === 'published' && (m.sold / m.total_seats) < 0.3).slice(0, 3).map(m => (
                <div key={m.id} style={opItemStyle}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.home_team} vs {m.away_team}</div>
                    <div style={{ fontSize: '0.7rem', color: '#991b1b' }}>Sold: {m.sold} / {m.total_seats}</div>
                  </div>
                </div>
              ))}
              {operations.filter(m => m.status === 'published' && (m.sold / m.total_seats) < 0.3).length === 0 && <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No critical matches.</p>}
            </div>
          </div>

          {/* Alerts: Canceled */}
          <div className="card" style={opCardStyle}>
            <h4 style={{ ...opTitleStyle, color: '#991b1b' }}>Alerts: Canceled</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {operations.filter(m => m.status === 'canceled').slice(0, 3).map(m => (
                <div key={m.id} style={opItemStyle}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.home_team} vs {m.away_team}</div>
                  <span className="badge rejected">Canceled</span>
                </div>
              ))}
              {operations.filter(m => m.status === 'canceled').length === 0 && <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No recent cancellations.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const kpiCardStyle = { padding: '24px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderRadius: '20px' };
const kpiLabelStyle = { fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#64748b', marginBottom: '8px', margin: 0 };
const kpiValueStyle = { fontSize: '1.75rem', fontWeight: 900, color: '#111827', margin: '0 0 4px 0' };
const sectionTitleStyle = { fontSize: '1.25rem', fontWeight: 900, marginBottom: '24px', color: '#111827', textTransform: 'uppercase', letterSpacing: '-0.5px' };
const thStyle = { padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' };
const tdStyle = { padding: '16px', fontSize: '0.85rem', color: '#1e293b' };
const opCardStyle = { padding: '24px', borderRadius: '20px', border: 'none', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const opTitleStyle = { fontSize: '0.9rem', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const opItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px' };

