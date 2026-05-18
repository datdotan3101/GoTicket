import api from './api'

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  googleLogin: (payload) => api.post('/auth/google', payload),
  me: () => api.get('/auth/me'),
  onboarding: (payload) => api.post('/auth/onboarding', payload),
  updateProfile: (payload) => api.put('/auth/profile', payload),
  changePassword: (payload) => api.put('/auth/change-password', payload),
  deleteAccount: () => api.delete('/auth/profile'),
}
