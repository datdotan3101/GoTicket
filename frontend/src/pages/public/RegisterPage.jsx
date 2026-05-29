import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import GoogleAuthButton from '../../common/GoogleAuthButton'
import { validateForm } from '../../utils/validator'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error as soon as user starts typing again
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    
    const schema = {
      fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full Name exceeds 255 characters' } },
      email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
      password: { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' }, maxLength: { value: 15, message: 'Password exceeds 15 characters' }, regex: { pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).*$/, message: 'Password must contain a letter, a number, and a special character' } }
    }
    if (!validateForm(form, schema)) return

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
      <form className="form" onSubmit={onSubmit} noValidate style={{ maxWidth: '100%' }}>
        <div className="field-group">
          <input
            name="fullName"
            type="text"
            placeholder="Full name"
            value={form.fullName}
            onChange={onChange}
           
          />
        </div>

        <div className="field-group">
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={onChange}
           
          />
        </div>

        <div className="field-group">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
           
          />
        </div>

        <button
          type="submit"
          className="btn-solid dark"
          disabled={isSubmitting}
          style={{ padding: '12px', fontSize: '1rem' }}
        >
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
      </form>

      <div className="auth-separator">OR</div>

      <GoogleAuthButton />
    </section>
  )
}
