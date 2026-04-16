import { useEffect, useMemo, useState } from 'react'

const getCountdownState = (targetDate) => {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }

  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0 || Number.isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds, isExpired: false }
}

export const useCountdown = (targetDate) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!targetDate) return undefined

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [targetDate])

  return useMemo(() => {
    if (!targetDate) return getCountdownState(targetDate)

    const diff = new Date(targetDate).getTime() - now
    if (diff <= 0 || Number.isNaN(diff)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return { days, hours, minutes, seconds, isExpired: false }
  }, [now, targetDate])
}
