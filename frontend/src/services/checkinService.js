import api from './api'

export const checkinService = {
  scanQr: (qrToken) => api.post('/checkin/scan', { qrToken }),
  checkinByCode: (ticketCode) => api.post('/checkin/code', { ticketCode }),
  getStatsByMatch: (matchId) => api.get(`/checkin/match/${matchId}/stats`),
}
