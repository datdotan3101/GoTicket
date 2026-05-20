import { Navigate, Outlet } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'

export default function GuestRoute() {
  const { isHydrated, isAuthenticated } = useAuth()

  if (!isHydrated) return null

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.HOME} replace />
  }

  return <Outlet />
}
