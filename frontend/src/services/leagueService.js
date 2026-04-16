import api from './api'

export const leagueService = {
  getAll: (params) => api.get('/leagues', { params }),
  create: (payload) => api.post('/leagues', payload),
  update: (id, payload) => api.put(`/leagues/${id}`, payload),
  remove: (id) => api.delete(`/leagues/${id}`),
}
