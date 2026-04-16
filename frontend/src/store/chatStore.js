import { create } from 'zustand'

export const useChatStore = create((set) => ({
  messages: [],
  recommendations: [],
  lastRecommendationsFetchedAt: null,
  pushMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setRecommendations: (recommendations) =>
    set({
      recommendations,
      lastRecommendationsFetchedAt: Date.now(),
    }),
  clearMessages: () => set({ messages: [] }),
}))
