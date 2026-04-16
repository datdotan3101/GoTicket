import api from './api'

export const clubService = {
  getAll: (params) => api.get('/clubs', { params }),
}
