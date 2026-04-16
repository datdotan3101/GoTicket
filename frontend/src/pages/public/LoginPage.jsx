import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
      login({ token: payload.accessToken, user: payload.user })
      toast.success('Login successful.')
      navigate(location.state?.from?.pathname ?? APP_ROUTES.HOME, { replace: true })
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

      <button 
        type="button" 
        onClick={() => toast('Google Auth feature coming soon!', { icon: '🚧' })} 
        className="btn-google"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        </svg>
        Continue with Google
      </button>
    </section>
  )
}
