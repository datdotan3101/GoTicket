import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { APP_ROUTES } from '../../constants/routes'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'

export default function AdminNavbar() {
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await approvalsService.getPending()
        const data = unwrapData(response) || []
        setPendingCount(data.length)
      } catch {
        // Ignore error
      }
    }

    fetchPending()
    const interval = setInterval(fetchPending, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="admin-sub-nav" style={{ 
      background: '#111827', 
      padding: '12px 0', 
      borderBottom: '1px solid #374151',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <Link to={APP_ROUTES.ADMIN_DASHBOARD} style={getLinkStyle(location.pathname === APP_ROUTES.ADMIN_DASHBOARD)}>Dashboard</Link>
          <Link to={APP_ROUTES.ADMIN_APPROVALS} style={{ ...getLinkStyle(location.pathname === APP_ROUTES.ADMIN_APPROVALS), display: 'flex', alignItems: 'center', gap: '6px' }}>
            Approvals
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 900, lineHeight: 1 }}>
                {pendingCount}
              </span>
            )}
          </Link>
          <Link to={APP_ROUTES.ADMIN_USERS} style={getLinkStyle(location.pathname === APP_ROUTES.ADMIN_USERS)}>Users</Link>
          <Link to={APP_ROUTES.ADMIN_MATCHES} style={getLinkStyle(location.pathname === APP_ROUTES.ADMIN_MATCHES)}>Matches</Link>
          <Link to={APP_ROUTES.ADMIN_SPORTS} style={getLinkStyle(location.pathname === APP_ROUTES.ADMIN_SPORTS)}>Sports</Link>
          <Link to={APP_ROUTES.ADMIN_LEAGUES} style={getLinkStyle(location.pathname === APP_ROUTES.ADMIN_LEAGUES)}>Leagues</Link>
        </div>
      </div>
    </div>
  )
}

function getLinkStyle(isActive) {
  return {
    color: isActive ? '#fff' : '#9ca3af',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: isActive ? '2px solid #fbbf24' : '2px solid transparent',
    paddingBottom: '4px',
    transition: 'all 0.2s'
  }
}
