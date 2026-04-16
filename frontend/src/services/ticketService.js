import api from './api'

export const ticketService = {
  book: ({ matchId, seatIds }) => api.post('/tickets/book', { matchId, seatIds }),
  getMyTickets: () => api.get('/tickets/my'),
}
