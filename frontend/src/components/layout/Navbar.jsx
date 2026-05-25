import { Link, NavLink, useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../hooks/useAuth'

const linkClassName = ({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')

// Dynamically generate the avatar letter based on the last word of the full name
const getAvatarInitial = (fullName) => {
  if (!fullName) return 'U'
  const words = fullName.trim().split(' ').filter(Boolean)
  if (words.length === 0) return 'U'
  return words[words.length - 1].charAt(0).toUpperCase()
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(APP_ROUTES.HOME, { replace: true })
  }

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link to={APP_ROUTES.HOME} className="brand text-black">GOTICKET</Link>

        {/* Central Minimal Nav */}
        <nav className="nav center-nav">
          {(!user || user.role === ROLES.AUDIENCE) && (
            <>
              <NavLink to={APP_ROUTES.HOME} className={linkClassName}>Home</NavLink>
              <NavLink to={APP_ROUTES.SPORTS} className={linkClassName}>Sports</NavLink>
            </>
          )}

          {user?.role === ROLES.MANAGER && (
            <>
              <NavLink to={APP_ROUTES.MANAGER_DASHBOARD} className={linkClassName} end>Dashboard</NavLink>
              <NavLink to={APP_ROUTES.MANAGER_MATCH_CREATE} className={linkClassName}>Create Match</NavLink>
              <NavLink to={APP_ROUTES.MANAGER_NOTIFICATIONS} className={linkClassName}>Inbox</NavLink>
            </>
          )}



          {user?.role === ROLES.EDITOR && (
            <>
              <NavLink to={APP_ROUTES.EDITOR_DASHBOARD} className={linkClassName} end>Dashboard</NavLink>
              <NavLink to={APP_ROUTES.EDITOR_NEWS_CREATE} className={linkClassName}>Create News</NavLink>
              <NavLink to={APP_ROUTES.EDITOR_NOTIFICATIONS} className={linkClassName}>Inbox</NavLink>
            </>
          )}

          {user?.role === ROLES.CHECKER && (
            <>
              <NavLink to={APP_ROUTES.CHECKER_DASHBOARD} className={linkClassName} end>Dashboard</NavLink>
              <NavLink to={APP_ROUTES.CHECKER_SCAN} className={linkClassName}>Scanner</NavLink>
            </>
          )}
        </nav>

        {/* Action Tray */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="user-menu-wrapper">
                <div className="google-avatar">
                  <div className="google-avatar-inner" title={user?.full_name}>
                    {getAvatarInitial(user?.full_name)}
                  </div>
                </div>
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-name">{user?.full_name}</span>
                    <span className="user-dropdown-role">{user?.role} Account</span>
                  </div>
                  {user?.role === ROLES.CHECKER && <Link to={APP_ROUTES.CHECKER_DASHBOARD}>Checker Portal</Link>}
                  {user?.role === ROLES.EDITOR && <Link to={APP_ROUTES.EDITOR_DASHBOARD}>Editor Portal</Link>}
                  {user?.role === ROLES.MANAGER && <Link to={APP_ROUTES.MANAGER_DASHBOARD}>Manager Portal</Link>}
                  {user?.role === ROLES.ADMIN && <Link to={APP_ROUTES.ADMIN_DASHBOARD}>Admin Portal</Link>}
                  <Link to={APP_ROUTES.PROFILE}>My Profile</Link>
                  {user?.role === ROLES.AUDIENCE && (
                    <Link to={APP_ROUTES.MY_TICKETS}>My Tickets</Link>
                  )}
                  <button type="button" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <NavLink to={APP_ROUTES.LOGIN} className="btn-outline" style={{ marginRight: '12px' }}>Login</NavLink>
              <NavLink to={APP_ROUTES.REGISTER} className="btn-solid dark">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
