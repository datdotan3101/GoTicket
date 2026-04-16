import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

export const useSocket = ({ enabled = true } = {}) => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!enabled || !import.meta.env.VITE_SOCKET_URL) return undefined

    const token = useAuthStore.getState().token
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
      auth: token ? { token: `Bearer ${token}` } : undefined,
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  return socketRef
}
