import api from './api'

export const dashboardService = {
  getManagerRevenue: () => api.get('/dashboard/manager/revenue'),
  getManagerMatchAnalytics: (matchId) => api.get(`/dashboard/manager/match/${matchId}`),
}
