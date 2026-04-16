import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isHydrated, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isHydrated) return null

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={APP_ROUTES.FORBIDDEN} replace />
  }

  return <Outlet />
}
