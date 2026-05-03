import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401
    const url = error.config?.url ?? ''
    // Never auto-logout on checkin routes — QR/code errors return 400,
    // but as a safety net, don't treat a checkin 401 as a session expiry.
    const isCheckinRoute = url.includes('/checkin/')
    if (is401 && !isCheckinRoute) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

export default api
