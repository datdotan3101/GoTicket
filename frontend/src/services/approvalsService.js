import api from './api'

export const approvalsService = {
  getPending: (params) => api.get('/approvals/pending', { params }),
  getDetail: (id) => api.get(`/approvals/${id}`),
  approve: (id) => api.post(`/approvals/${id}/approve`),
  reject: (id, reason) => api.post(`/approvals/${id}/reject`, { reason }),
}
