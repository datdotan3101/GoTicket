import api from './api'

export const matchService = {
  getAll: (params) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  getSeats: (id) => api.get(`/matches/${id}/seats`),
  create: (payload) => api.post('/matches', payload),
  update: (id, payload) => api.put(`/matches/${id}`, payload),
  submit: (id) => api.post(`/matches/${id}/submit`),
  previewStands: (payload) => api.post('/matches/stands/preview', payload),
  configureStands: (id, payload) => api.put(`/matches/${id}/stands`, payload),
}
