import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { APP_ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
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
      toast.success('Register completed. Please wait for admin approval.')
      navigate(APP_ROUTES.LOGIN)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Register failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container page">
      <h1>Register</h1>
      <form className="form" onSubmit={onSubmit}>
        <input name="full_name" type="text" placeholder="Full name" value={form.full_name} onChange={onChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Create account'}</button>
      </form>
    </section>
  )
}
