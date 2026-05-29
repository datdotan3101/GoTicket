import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { Users, Ticket, CheckCircle, TrendingUp, Loader2 } from 'lucide-react'

export default function MatchAnalyticsPage() {
  const { matchId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await dashboardService.getManagerMatchAnalytics(matchId)
        setData(unwrapData(response))
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [matchId])

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <Loader2 size={32} className="lucide-spin" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading match analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontWeight: 600 }}>No analytics available for this match.</p>
      </div>
    )
  }

  // Format peak hours data
  const peakHoursData = (data.peakHours || []).map(p => ({
    hour: p.hour,
    checkins: Number(p.checkins)
  }))

  const pieData = [
    { name: 'Checked In', value: Number(data.checkinStats?.checked_in_tickets || 0), color: '#10b981' },
    { name: 'Not Checked In', value: Math.max(0, Number(data.checkinStats?.paid_tickets || 0) - Number(data.checkinStats?.checked_in_tickets || 0)), color: '#e2e8f0' }
  ]

  return (
    <section className="container manager-dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '32px' }}>
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Match Analytics</h1>
          <p className="dashboard-subtitle">{data.match?.home_team} vs {data.match?.away_team}</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Ticket size={24} />
          </div>
          <span className="stat-label">Total Capacity</span>
          <h2 className="stat-value">{data.checkinStats?.total_tickets || 0}</h2>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Users size={24} />
          </div>
          <span className="stat-label">Paid Tickets</span>
          <h2 className="stat-value">{data.checkinStats?.paid_tickets || 0}</h2>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#dcfce7', color: '#166534' }}>
            <CheckCircle size={24} />
          </div>
          <span className="stat-label">Checked In</span>
          <h2 className="stat-value">{data.checkinStats?.checked_in_tickets || 0}</h2>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Peak Hours Line Chart */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#4f46e5" />
            Peak Check-in Hours
          </h3>
          <div style={{ height: '300px' }}>
            {peakHoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="checkins" name="Check-ins" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#4f46e5', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No check-in data yet
              </div>
            )}
          </div>
        </div>

        {/* Checkin Pie Chart */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Attendance Overview</h3>
          <div style={{ height: '300px' }}>
            {pieData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No tickets sold yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stand Bar Chart */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Stand Performance</h3>
        <div style={{ height: '400px' }}>
          {data.byStand && data.byStand.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byStand} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="stand_name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} angle={-45} textAnchor="end" />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₫${(val/1000000).toFixed(1)}M`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  formatter={(value, name) => {
                    if (name === 'Revenue') return [formatVND(value), name]
                    return [value, name]
                  }}
                  labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar yAxisId="left" dataKey="sold" name="Tickets Sold" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="checked_in" name="Checked In" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              No stand data available
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
