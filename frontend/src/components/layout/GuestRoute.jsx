import { Navigate, Outlet } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { getRedirectPath } from '../../utils/authUtils'

export default function GuestRoute() {
  const { isHydrated, isAuthenticated, user } = useAuth()

  if (!isHydrated) return null

  if (isAuthenticated) {
    const targetPath = getRedirectPath(user, APP_ROUTES.HOME)
    return <Navigate to={targetPath} replace />
  }

  return <Outlet />
}
