import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import GoogleAuthButton from '../../common/GoogleAuthButton'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await authService.register(form)
      toast.success('Registration successful. You can log in now.')
      navigate(APP_ROUTES.LOGIN)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Register failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container page auth-wrapper">
      <h1 className="auth-title">Create Account</h1>
      <form className="form" onSubmit={onSubmit} style={{ maxWidth: '100%' }}>
        <input name="fullName" type="text" placeholder="Full name" value={form.fullName} onChange={onChange} required />
        <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <button type="submit" className="btn-solid dark" disabled={isSubmitting} style={{ padding: '12px', fontSize: '1rem' }}>
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
      </form>

      <div className="auth-separator">OR</div>

      <GoogleAuthButton />
    </section>
  )
}
