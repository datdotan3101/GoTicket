import api from './api'

export const ticketService = {
  book: (data) => api.post('/tickets/book', data),
  getMyTickets: () => api.get('/tickets/my'),
  cancel: (ticketIds) => api.post('/tickets/cancel', { ticketIds }),
  refundTicket: (ticketCode) => api.post(`/tickets/${ticketCode}/refund`),
  giftTicket: (ticketCode, email) => api.post(`/tickets/${ticketCode}/gift`, { email }),
}
