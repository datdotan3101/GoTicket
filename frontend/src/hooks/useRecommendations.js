import { useState, useEffect } from 'react'
import { aiService } from '../services/aiService'
import { useChatStore } from '../store/chatStore'
import { unwrapData } from '../utils/apiData'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useRecommendations = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const recommendations = useChatStore((state) => state.recommendations)
  const setRecommendations = useChatStore((state) => state.setRecommendations)
  const lastFetchedAt = useChatStore((state) => state.lastRecommendationsFetchedAt)

  useEffect(() => {
    let isMounted = true

    const fetchRecommendations = async () => {
      // Check if cache is still valid
      if (lastFetchedAt && (Date.now() - lastFetchedAt < CACHE_DURATION) && recommendations.length > 0) {
        return // Use cached recommendations
      }

      try {
        setIsLoading(true)
        setError(null)
        const response = await aiService.getRecommendations()
        const data = unwrapData(response) || []
        if (isMounted) {
          setRecommendations(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch recommendations')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchRecommendations()

    return () => {
      isMounted = false
    }
  }, [lastFetchedAt, recommendations.length, setRecommendations])

  return {
    recommendations,
    isLoading,
    error,
  }
}
