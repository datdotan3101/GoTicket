import api from './api'

export const paymentService = {
  createIntent: ({ ticketIds, currency = 'vnd' }) =>
    api.post('/payments/create-intent', { ticketIds, currency }),
}
