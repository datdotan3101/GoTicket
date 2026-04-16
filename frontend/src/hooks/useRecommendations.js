import { useMemo } from 'react'
import { useChatStore } from '../store/chatStore'

export const useRecommendations = () => {
  const recommendations = useChatStore((state) => state.recommendations)
  const setRecommendations = useChatStore((state) => state.setRecommendations)

  return useMemo(
    () => ({ recommendations, setRecommendations }),
    [recommendations, setRecommendations],
  )
}
