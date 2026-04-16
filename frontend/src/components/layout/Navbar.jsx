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
    navigate(APP_ROUTES.HOME)
  }

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link to={APP_ROUTES.HOME} className="brand text-black">GOTICKET</Link>

        {/* Central Minimal Nav */}
        <nav className="nav center-nav">
          <NavLink to={APP_ROUTES.HOME} className={linkClassName}>Home</NavLink>
          <NavLink to={APP_ROUTES.SPORTS} className={linkClassName}>Sports</NavLink>
          <NavLink to={APP_ROUTES.NEWS} className={linkClassName}>News</NavLink>
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
                  <Link to={APP_ROUTES.MY_TICKETS}>My Tickets</Link>
                  <button type="button" onClick={handleLogout}>Đăng xuất</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <NavLink to={APP_ROUTES.LOGIN} className="nav-link mr-4">Login</NavLink>
              <NavLink to={APP_ROUTES.REGISTER} className="btn-solid dark">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
