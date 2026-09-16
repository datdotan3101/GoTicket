import { useEffect, useState, useMemo } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

export const useSocket = ({ enabled = true } = {}) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000')
    if (!enabled || !socketUrl) return undefined

    const token = useAuthStore.getState().token
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: token ? { token: `Bearer ${token}` } : undefined,
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [enabled])

  // Return an object that mimics a ref, but changes identity when socket connects
  // to trigger effects in consumer components.
  return useMemo(() => ({ current: socket }), [socket])
}
