import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Eye, EyeOff } from 'lucide-react'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import { getRedirectPath } from '../../utils/authUtils'
import GoogleAuthButton from '../../common/GoogleAuthButton'
import { validateForm } from '../../utils/validator'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = getRedirectPath(user)
      navigate(targetPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error as soon as user starts typing again
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!form.email && !form.password) {
      toast.error('Please enter email and password')
      return
    }

    const schema = {
      email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
      password: { required: 'Password is required' }
    }
    if (!validateForm(form, schema)) return

    setIsSubmitting(true)

    try {
      const response = await authService.login(form)
      const payload = response.data?.data ?? response.data
      const loggedInUser = payload.user
      login({ token: payload.accessToken, user: loggedInUser })
      toast.success('Login successful.')

      const defaultPath = location.state?.from?.pathname ?? APP_ROUTES.HOME
      const targetPath = getRedirectPath(loggedInUser, defaultPath)

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
      <form className="form" onSubmit={onSubmit} noValidate style={{ maxWidth: '100%' }}>
        <div className="field-group">
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={onChange}
           
          />
        </div>

        <div className="field-group" style={{ position: 'relative' }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-slate-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="btn-solid dark"
          disabled={isSubmitting}
          style={{ padding: '12px', fontSize: '1rem' }}
        >
          {isSubmitting ? 'Logging in...' : 'Login to GoTicket'}
        </button>
      </form>

      <div className="auth-separator">OR</div>

      <GoogleAuthButton />
    </section>
  )
}
