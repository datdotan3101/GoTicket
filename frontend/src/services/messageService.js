import api from './api'

export const messageService = {
  getInbox: () => api.get('/messages/inbox'),
  getUnreadCount: () => api.get('/messages/unread-count'),
  getSent: () => api.get('/messages/sent'),
  getDrafts: () => api.get('/messages/drafts'),
  getStarred: () => api.get('/messages/starred'),
  getRecipients: () => api.get('/messages/recipients'),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (id) => api.patch(`/messages/${id}/read`),
  markAllAsRead: () => api.patch('/messages/mark-all-read'),
  toggleStar: (id) => api.patch(`/messages/${id}/star`)
}
