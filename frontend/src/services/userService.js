import api from './api'

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  updateRole: (id, role, clubId = null) => api.put(`/users/${id}/role`, { role, clubId }),
  setActive: (id, isActive) => api.put(`/users/${id}/active`, { isActive }),
}
