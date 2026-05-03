import api from './api'

export const checkinService = {
  scanQr: (qrToken) => api.post('/checkin/scan', { qrToken }),
  checkinByCode: (ticketCode) => api.post('/checkin/code', { ticketCode }),
  confirm: (ticketCode) => api.post('/checkin/confirm', { ticketCode }),
  getStatsByMatch: (matchId) => api.get(`/checkin/match/${matchId}/stats`),
}
