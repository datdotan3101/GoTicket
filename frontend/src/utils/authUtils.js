import { APP_ROUTES } from '../constants/routes'
import { ROLES } from '../constants/roles'

/**
 * Determines the redirection path based on user email domain and role.
 * Users with @goticket.vn domain are redirected to their respective portals.
 * 
 * @param {Object} user - The user object containing email and role.
 * @param {string} defaultPath - The default path to redirect if conditions are not met.
 * @returns {string} The target redirection path.
 */
export const getRedirectPath = (user, defaultPath = APP_ROUTES.HOME) => {
  if (!user || !user.email) return defaultPath

  // Priority redirection for internal staff
  if (user.email.endsWith('@goticket.vn')) {
    switch (user.role) {
      case ROLES.ADMIN:
        return APP_ROUTES.ADMIN_DASHBOARD
      case ROLES.MANAGER:
        return APP_ROUTES.MANAGER_DASHBOARD
      case ROLES.EDITOR:
        return APP_ROUTES.EDITOR_DASHBOARD
      case ROLES.CHECKER:
        return APP_ROUTES.CHECKER_DASHBOARD
      default:
        return defaultPath
    }
  }

  return defaultPath
}
