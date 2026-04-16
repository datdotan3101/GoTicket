import api from './api'

export const checkinService = {
  scanQr: (qrToken) => api.post('/checkin/scan', { qrToken }),
  getStatsByMatch: (matchId) => api.get(`/checkin/match/${matchId}/stats`),
}
