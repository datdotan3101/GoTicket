import { Link, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'

export default function AdminNavbar() {
  const location = useLocation()

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
          <Link to={APP_ROUTES.ADMIN_APPROVALS} style={getLinkStyle(location.pathname === APP_ROUTES.ADMIN_APPROVALS)}>Approvals</Link>
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
