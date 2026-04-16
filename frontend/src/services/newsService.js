import api from './api'

export const newsService = {
  getAll: (params) => api.get('/news', { params }),
  getBySlug: (slug) => api.get(`/news/slug/${slug}`),
  getMyNews: (params) => api.get('/news/my', { params }),
  getById: (id) => api.get(`/news/${id}`),
  create: (payload) => api.post('/news', payload),
  update: (id, payload) => api.put(`/news/${id}`, payload),
  remove: (id) => api.delete(`/news/${id}`),
  submit: (id) => api.post(`/news/${id}/submit`),
}
