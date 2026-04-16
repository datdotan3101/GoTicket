import api from './api'

export const leagueService = {
  getAll: (params) => api.get('/leagues', { params }),
}
