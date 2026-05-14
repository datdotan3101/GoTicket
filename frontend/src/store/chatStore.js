import { create } from 'zustand'

export const useChatStore = create((set) => ({
  messages: [],
  recommendations: [],
  lastRecommendationsFetchedAt: null,
  pendingBooking: null,

  pushMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  setRecommendations: (recommendations) =>
    set({
      recommendations,
      lastRecommendationsFetchedAt: Date.now(),
    }),

  setPendingBooking: (booking) => set({ pendingBooking: booking }),
  clearPendingBooking: () => set({ pendingBooking: null }),

  clearMessages: () => set({ messages: [], pendingBooking: null }),
}))
