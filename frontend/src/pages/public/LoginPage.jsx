import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import { useEffect } from 'react'
import { getRedirectPath } from '../../utils/authUtils'
import GoogleAuthButton from '../../common/GoogleAuthButton'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-redirect if already authenticated and has staff domain
  useEffect(() => {
    if (isAuthenticated && user?.email?.endsWith('@goticket.vn')) {
      const targetPath = getRedirectPath(user)
      navigate(targetPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await authService.login(form)
      const payload = response.data?.data ?? response.data
      const user = payload.user
      login({ token: payload.accessToken, user })
      toast.success('Login successful.')
      
      const defaultPath = location.state?.from?.pathname ?? APP_ROUTES.HOME
      const targetPath = getRedirectPath(user, defaultPath)
      
      navigate(targetPath, { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container page auth-wrapper">
      <h1 className="auth-title">Welcome Back</h1>
      <form className="form" onSubmit={onSubmit} style={{ maxWidth: '100%' }}>
        <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <button type="submit" className="btn-solid dark" disabled={isSubmitting} style={{ padding: '12px', fontSize: '1rem' }}>
          {isSubmitting ? 'Logging in...' : 'Login to GoTicket'}
        </button>
      </form>

      <div className="auth-separator">OR</div>

      <GoogleAuthButton />
    </section>
  )
}
