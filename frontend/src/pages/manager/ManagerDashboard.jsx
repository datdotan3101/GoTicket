/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { 
  Mail, 
  DollarSign, 
  Ticket, 
  Calendar, 
  TrendingUp,
  Download
} from 'lucide-react'
import { APP_ROUTES } from '../../constants/routes'
import { dashboardService } from '../../services/dashboardService'
import { messageService } from '../../services/messageService'
import { unwrapData } from '../../utils/apiData'
import { formatVND } from '../../utils/formatters'
import { formatDateTime } from '../../utils/formatters'
import { downloadCSV } from '../../utils/excelUtils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

const MOCK_DATA = {
  summary: {
    total_revenue: 0,
    total_tickets: 0,
    total_matches: 0
  },
  byMatch: []
}

export default function ManagerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchAll()
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await messageService.getUnreadCount()
      const data = unwrapData(response)
      if (data?.count !== undefined) setUnreadCount(data.count)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const response = await dashboardService.getManagerRevenue()
      const payload = unwrapData(response)
      setData({
        summary: payload?.summary || MOCK_DATA.summary,
        byMatch: payload?.byMatch || MOCK_DATA.byMatch
      })
    } catch {
      setData(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }



  const exportToExcel = () => {
    if (!data) return;
    
    let csvContent = "MATCH,REVENUE (VND),TICKETS SOLD,MATCH DATE,STATUS\n";
    
    (data.byMatch || []).forEach(m => {
      csvContent += `"${m.home_team} vs ${m.away_team}",${m.revenue},${m.tickets_sold},"${m.match_date ? formatDateTime(m.match_date).replace(/"/g, '""') : '--'}","${m.status || '--'}"\n`;
    });
    
    csvContent += "\nSUMMARY\n";
    csvContent += `Total Revenue,${data.summary.total_revenue}\n`;
    csvContent += `Tickets Sold,${data.summary.total_tickets}\n`;
    csvContent += `Total Matches,${data.summary.total_matches}\n`;
    
    downloadCSV(csvContent, `manager_overview_${new Date().toISOString().slice(0,10)}.csv`);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-slate-500)', fontWeight: 600 }}>Loading manager analytics...</p>
      </div>
    )
  }

  return (
    <section className="container manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Manager Portal</h1>
          <p className="dashboard-subtitle">Track your matches performance and manage ticket sales</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={exportToExcel}
            className="mc-btn mc-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
          >
            <Download size={18} />
            Export Data
          </button>
          <Link className="mc-btn mc-btn-ghost" to={APP_ROUTES.MANAGER_MAILBOX} style={{ position: 'relative', border: '1px solid var(--color-slate-300)' }}>
            <Mail size={18} style={{ marginRight: '8px' }} />
            Mailbox
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--color-danger)',
                color: 'var(--color-white)',
                fontSize: '0.65rem',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid var(--color-white)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {data?.summary && (
        <div className="stats-grid">
          {(() => {
            const matches = data?.byMatch || []
            const latest = matches[0]
            const previous = matches[1]
            
            const getGrowth = (currentVal, previousVal) => {
              if (!previousVal || previousVal === 0) return null
              return (((currentVal - previousVal) / previousVal) * 100).toFixed(1)
            }

            const revGrowth = latest && previous ? getGrowth(Number(latest.revenue), Number(previous.revenue)) : null
            const tickGrowth = latest && previous ? getGrowth(Number(latest.tickets_sold), Number(previous.tickets_sold)) : null

            return (
              <>
                <div className="stat-card" style={{ color: 'var(--color-primary-600)' }}>
                  <div className="stat-icon-wrap" style={{ background: 'var(--color-primary-100)' }}>
                    <DollarSign size={24} />
                  </div>
                  <span className="stat-label">Total Revenue</span>
                  <h2 className="stat-value">{formatVND(data.summary.total_revenue)}</h2>
                  {revGrowth !== null ? (
                    <div className={`stat-trend ${revGrowth >= 0 ? 'up' : 'down'}`} style={{ color: revGrowth >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {revGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                      <span>{Math.abs(revGrowth)}% vs last match</span>
                    </div>
                  ) : (
                    <div className="stat-trend up">
                      <TrendingUp size={12} />
                      <span>Live tracking</span>
                    </div>
                  )}
                </div>

                <div className="stat-card" style={{ color: '#0891b2' }}>
                  <div className="stat-icon-wrap" style={{ background: '#cffafe' }}>
                    <Ticket size={24} />
                  </div>
                  <span className="stat-label">Tickets Sold</span>
                  <h2 className="stat-value">{data.summary.total_tickets.toLocaleString()}</h2>
                  {tickGrowth !== null ? (
                    <div className={`stat-trend ${tickGrowth >= 0 ? 'up' : 'down'}`} style={{ color: tickGrowth >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {tickGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                      <span>{Math.abs(tickGrowth)}% vs last match</span>
                    </div>
                  ) : (
                    <div className="stat-trend up">
                      <TrendingUp size={12} />
                      <span>Real-time update</span>
                    </div>
                  )}
                </div>
              </>
            )
          })()}

          <div className="stat-card" style={{ color: '#b45309' }}>
            <div className="stat-icon-wrap" style={{ background: '#fef3c7' }}>
              <Calendar size={24} />
            </div>
            <span className="stat-label">Total Matches</span>
            <h2 className="stat-value">{data.summary.total_matches}</h2>
            <span className="dashboard-subtitle" style={{ fontSize: '0.75rem' }}>Active campaigns</span>
          </div>
        </div>
      )}

      {data?.byMatch && (
        <div style={{ 
          marginTop: '40px', 
          background: 'var(--color-white)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--color-slate-200)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: 'var(--color-slate-900)' }}>Revenue Overview</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart
                data={[...data.byMatch].reverse().map(m => ({
                  name: `${m.home_team.substring(0,3).toUpperCase()} v ${m.away_team.substring(0,3).toUpperCase()}`,
                  revenue: Number(m.revenue) / 1000000 // Convert to millions for better display
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-slate-500)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-slate-500)', fontSize: 12 }} tickFormatter={(value) => `${value}M`} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-slate-100)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}M VND`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </section>
  )
}
