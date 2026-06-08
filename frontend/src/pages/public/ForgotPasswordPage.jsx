import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import { useTimer } from '../../hooks/useTimer'

const RESEND_COUNTDOWN = 60 // seconds

function OTPInput({ value, onChange }) {
  const inputRefs = useRef([])
  const digits = value.split('')

  const focusBox = (idx) => {
    inputRefs.current[idx]?.focus()
  }

  const handleKey = (e, idx) => {
    const key = e.key

    if (key === 'Backspace') {
      e.preventDefault()
      if (digits[idx]) {
        // Clear current box
        const next = [...digits]
        next[idx] = ''
        onChange(next.join(''))
      } else if (idx > 0) {
        // Clear previous box and move back
        const next = [...digits]
        next[idx - 1] = ''
        onChange(next.join(''))
        focusBox(idx - 1)
      }
      return
    }

    if (key === 'ArrowLeft' && idx > 0) { focusBox(idx - 1); return }
    if (key === 'ArrowRight' && idx < 5) { focusBox(idx + 1); return }

    if (/^\d$/.test(key)) {
      e.preventDefault()
      const next = [...digits]
      next[idx] = key
      onChange(next.join(''))
      if (idx < 5) focusBox(idx + 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6).replace(/ /g, ''))
      onChange(pasted)
      focusBox(Math.min(pasted.length, 5))
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '8px 0 20px' }}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ''}
          onKeyDown={(e) => handleKey(e, idx)}
          onPaste={handlePaste}
          onChange={() => {}} // controlled via onKeyDown
          onClick={() => focusBox(idx)}
          style={{
            width: '46px',
            height: '54px',
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            border: digits[idx] ? '2px solid #2563eb' : '2px solid #d1d5db',
            borderRadius: '10px',
            outline: 'none',
            background: digits[idx] ? '#eff6ff' : '#fff',
            color: '#0f172a',
            transition: 'border-color 0.15s, background 0.15s',
            cursor: 'text',
            caretColor: 'transparent',
          }}
        />
      ))}
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useTimer(0)
  const navigate = useNavigate()

  const sendOTP = useCallback(async () => {
    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('OTP sent to your email!')
      setResendCountdown(RESEND_COUNTDOWN)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [email])

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    if (!email.trim()) return toast.error('Please enter your email address')
    const success = await sendOTP()
    if (success) {
      setStep(2)
    }
  }

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return
    await sendOTP()
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Please enter the full 6-digit OTP')
    setIsLoading(true)
    try {
      await api.post('/auth/verify-otp', { email, otp })
      toast.success('OTP verified!')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword })
      toast.success('Password reset successfully! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const stepTitle = step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter OTP' : 'New Password'
  const stepDesc = step === 1
    ? 'Enter your email and we will send you a 6-digit OTP code.'
    : step === 2
    ? `We sent a 6-digit code to ${email}`
    : 'Enter and confirm your new password.'

  return (
    <section className="container page auth-wrapper">
      <h1 className="auth-title">{stepTitle}</h1>
      <p style={{ textAlign: 'center', color: 'var(--color-slate-500)', marginBottom: '16px', fontSize: '0.9rem' }}>
        {stepDesc}
      </p>

      {/* ── Step 1: Email ── */}
      {step === 1 && (
        <form className="form" onSubmit={handleRequestOTP} noValidate style={{ maxWidth: '100%' }}>
          <div className="field-group" style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)', pointerEvents: 'none' }} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '38px' }}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-solid dark" disabled={isLoading} style={{ padding: '12px', fontSize: '1rem' }}>
            {isLoading ? 'Sending...' : 'Send OTP Code'}
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 2 && (
        <form className="form" onSubmit={handleVerifyOTP} noValidate style={{ maxWidth: '100%' }}>
          <OTPInput value={otp} onChange={setOtp} />

          <button type="submit" className="btn-solid dark" disabled={isLoading || otp.length !== 6} style={{ padding: '12px', fontSize: '1rem' }}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          {/* Resend row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
              Didn't receive the code?
            </span>
            {resendCountdown > 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-400)', fontWeight: 600 }}>
                Resend in {resendCountdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
              >
                <RefreshCw size={14} /> Resend
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', marginTop: '8px', textDecoration: 'underline', display: 'block', width: '100%', textAlign: 'center' }}
          >
            ← Change email
          </button>
        </form>
      )}

      {/* ── Step 3: New Password ── */}
      {step === 3 && (
        <form className="form" onSubmit={handleResetPassword} noValidate style={{ maxWidth: '100%' }}>
          <div className="field-group" style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)', pointerEvents: 'none' }} />
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ paddingLeft: '38px', paddingRight: '40px' }}
              autoFocus
            />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', padding: 0 }}>
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="field-group" style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)', pointerEvents: 'none' }} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingLeft: '38px', paddingRight: '40px' }}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', padding: 0 }}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="btn-solid dark" disabled={isLoading} style={{ padding: '12px', fontSize: '1rem' }}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={15} /> Back to Login
        </button>
      </div>
    </section>
  )
}
