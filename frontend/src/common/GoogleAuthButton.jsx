import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authService } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { APP_ROUTES } from '../constants/routes'
import { getRedirectPath } from '../utils/authUtils'

// Module-level flag: Google GSI must only be initialized ONCE per page load.
// Re-calling initialize() causes "called multiple times" warning and 500 errors.
let gsiInitialized = false

export default function GoogleAuthButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const containerRef = useRef(null)

  // Store the latest callback values in a ref so the GSI callback always has
  // a fresh closure WITHOUT needing to re-initialize GSI on every render.
  const authHandlerRef = useRef(null)
  authHandlerRef.current = { login, navigate, locationState: location.state }

  const handleCredentialResponse = useCallback(async (response) => {
    const { login: _login, navigate: _navigate, locationState } = authHandlerRef.current
    const loadingToast = toast.loading('Authenticating with Google...')
    try {
      const res = await authService.googleLogin({ idToken: response.credential })
      const payload = res.data?.data ?? res.data
      _login({ token: payload.accessToken, user: payload.user })
      toast.dismiss(loadingToast)
      toast.success('Google Sign-in successful!')
      const defaultPath = locationState?.from?.pathname ?? APP_ROUTES.HOME
      const targetPath = getRedirectPath(payload.user, defaultPath)
      _navigate(targetPath, { replace: true })
    } catch (error) {
      console.error('Google Auth Error:', error)
      const errorMsg = error.response?.data?.message ?? 'Google Sign-in failed.'
      toast.dismiss(loadingToast)
      toast.error(errorMsg)
    }
  }, []) // ← stable: no deps needed because we read from authHandlerRef

  useEffect(() => {
    if (!clientId) return

    const initGSI = () => {
      if (!window.google) return

      // FIX 2: Only initialize once — re-calling causes "multiple times" warning + 500 errors
      if (!gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          locale: 'en',
        })
        gsiInitialized = true
      }

      // FIX 1: width must be a pixel number, not '100%' — measure the container
      const container = containerRef.current
      if (container) {
        // Use the container's actual rendered width (or fall back to 400px)
        const px = container.offsetWidth || 400
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: px,           // ← number, not string with '%'
          text: 'continue_with',
          shape: 'rectangular',
        })
      }
    }

    if (window.google) {
      initGSI()
    } else {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initGSI
        document.body.appendChild(script)
      } else {
        existing.addEventListener('load', initGSI)
      }
    }
  }, [clientId, handleCredentialResponse])

  if (!clientId) {
    return (
      <div style={{ width: '100%' }}>
        <button
          type="button"
          className="btn-google"
          disabled
          style={{
            width: '100%',
            color: '#E53E3E',
            borderColor: '#FEB2B2',
            backgroundColor: '#FFF5F5',
            opacity: 0.9,
            cursor: 'not-allowed',
            fontWeight: 600,
            padding: '12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ VITE_GOOGLE_CLIENT_ID is not configured in .env
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* ref lets us measure the real pixel width before calling renderButton */}
      <div ref={containerRef} style={{ width: '100%', minHeight: '44px' }} />
    </div>
  )
}

