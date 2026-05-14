import api from './api'

export const aiService = {
  chat: (messages) => api.post('/ai/chat', { messages }, { timeout: 30000 }),
  getRecommendations: () => api.get('/ai/recommendations'),
}
