import api from './api'

export const stadiumService = {
  getAll: (params) => api.get('/stadiums', { params }),
  getById: (id) => api.get(`/stadiums/${id}`),
  create: (data) => api.post('/stadiums', data),
  update: (id, data) => api.put(`/stadiums/${id}`, data),
  remove: (id) => api.delete(`/stadiums/${id}`)
}
