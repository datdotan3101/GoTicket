import api from './api'

export const stadiumService = {
  getAll: (params) => api.get('/stadiums', { params }),
}
