import api from './api'

export const sportService = {
  getAll: () => api.get('/sports'),
  create: (payload) => api.post('/sports', payload),
  update: (id, payload) => api.put(`/sports/${id}`, payload),
  remove: (id) => api.delete(`/sports/${id}`),
}
