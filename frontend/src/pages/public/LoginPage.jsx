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
      navigate(location.state?.from?.pathname ?? APP_ROUTES.DASHBOARD, { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container page">
      <h1>Login</h1>
      <form className="form" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
      </form>
    </section>
  )
}
