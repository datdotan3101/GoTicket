import api from './api'

export const dashboardService = {
  getAdminRevenue: () => api.get('/dashboard/admin/revenue'),
  getManagerRevenue: () => api.get('/dashboard/manager/revenue'),
  getManagerMatchAnalytics: (matchId) => api.get(`/dashboard/manager/match/${matchId}`),
}
