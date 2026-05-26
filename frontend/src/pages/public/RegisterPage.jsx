import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import GoogleAuthButton from '../../common/GoogleAuthButton'
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateRegisterFields,
} from '../../utils/validation'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error as soon as user starts typing again
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const onBlur = (event) => {
    const { name, value } = event.target
    if (name === 'fullName') {
      const { isValid, message } = validateFullName(value)
      if (!isValid) setErrors((prev) => ({ ...prev, fullName: message }))
    }
    if (name === 'email') {
      const { isValid, message } = validateEmail(value)
      if (!isValid) setErrors((prev) => ({ ...prev, email: message }))
    }
    if (name === 'password') {
      const { isValid, message } = validatePassword(value)
      if (!isValid) setErrors((prev) => ({ ...prev, password: message }))
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const { isValid, errors: fieldErrors } = validateRegisterFields(form)
    if (!isValid) {
      setErrors(fieldErrors)
      return
    }

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
            onBlur={onBlur}
            className={errors.fullName ? 'input-error' : ''}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

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
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
      </form>

      <div className="auth-separator">OR</div>

      <GoogleAuthButton />
    </section>
  )
}
