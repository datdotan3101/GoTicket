import { Link, NavLink } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../hooks/useAuth'

const linkClassName = ({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link to={APP_ROUTES.HOME} className="brand">GoTicket</Link>
        <nav className="nav">
          <NavLink to={APP_ROUTES.HOME} className={linkClassName}>Home</NavLink>
          <NavLink to={APP_ROUTES.NEWS} className={linkClassName}>News</NavLink>
          {isAuthenticated && <NavLink to={APP_ROUTES.MY_TICKETS} className={linkClassName}>My tickets</NavLink>}
          {user?.role === ROLES.CHECKER && <NavLink to={APP_ROUTES.CHECKER_DASHBOARD} className={linkClassName}>Checker</NavLink>}
          {user?.role === ROLES.EDITOR && <NavLink to={APP_ROUTES.EDITOR_DASHBOARD} className={linkClassName}>Editor</NavLink>}
          {user?.role === ROLES.MANAGER && <NavLink to={APP_ROUTES.MANAGER_DASHBOARD} className={linkClassName}>Manager</NavLink>}
          {user?.role === ROLES.ADMIN && <NavLink to={APP_ROUTES.ADMIN_DASHBOARD} className={linkClassName}>Admin</NavLink>}
          {!isAuthenticated && <NavLink to={APP_ROUTES.LOGIN} className={linkClassName}>Login</NavLink>}
          {!isAuthenticated && <NavLink to={APP_ROUTES.REGISTER} className={linkClassName}>Register</NavLink>}
          {isAuthenticated && <button type="button" className="ghost-button" onClick={logout}>Logout</button>}
        </nav>
        <div className="user-role">{user?.role ?? 'guest'}</div>
      </div>
    </header>
  )
}
