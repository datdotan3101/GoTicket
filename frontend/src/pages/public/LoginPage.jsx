import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import { getRedirectPath } from '../../utils/authUtils'
import GoogleAuthButton from '../../common/GoogleAuthButton'
import { validateEmail, validateLoginFields } from '../../utils/validation'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const onBlur = (event) => {
    const { name, value } = event.target
    if (name === 'email') {
      const { isValid, message } = validateEmail(value)
      if (!isValid) setErrors((prev) => ({ ...prev, email: message }))
    }
    if (name === 'password' && !value) {
      setErrors((prev) => ({ ...prev, password: 'Password is required.' }))
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const { isValid, errors: fieldErrors } = validateLoginFields(form)
    if (!isValid) {
      setErrors(fieldErrors)
      return
    }

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
            onBlur={onBlur}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field-group">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            className={errors.password ? 'input-error' : ''}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
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
