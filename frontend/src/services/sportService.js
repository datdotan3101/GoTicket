import api from './api'

export const sportService = {
  getAll: () => api.get('/sports'),
}
