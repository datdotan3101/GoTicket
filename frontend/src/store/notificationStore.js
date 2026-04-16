import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  items: [],
  unreadCount: 0,
  setNotifications: (items) => set({ items, unreadCount: items.filter((item) => !item.is_read).length }),
  markRead: (notificationId) =>
    set((state) => {
      const items = state.items.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item,
      )
      return { items, unreadCount: items.filter((item) => !item.is_read).length }
    }),
}))
