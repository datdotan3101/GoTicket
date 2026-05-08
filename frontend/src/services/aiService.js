import api from './api'

export const aiService = {
  chat: (messages) => api.post('/ai/chat', { messages }),
  getRecommendations: () => api.get('/ai/recommendations'),
}
