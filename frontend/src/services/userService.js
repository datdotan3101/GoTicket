import api from './api'

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  updateRole: (id, role, clubId = null) => api.put(`/users/${id}/role`, { role, clubId }),
  setActive: (id, isActive) => api.put(`/users/${id}/active`, { isActive }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
}
