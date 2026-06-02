/**
 * PasswordTab — "Password / Security" tab.
 * Receives state/handlers from useProfile via props.
 */
import { inputBase, fieldGroup, fieldLabel, btnDanger } from '../../styles/common'

const focusInput = (e) => {
  e.target.style.borderColor = '#6366f1'
  e.target.style.background = '#fff'
}
const blurInput = (e) => {
  e.target.style.borderColor = '#e2e8f0'
  e.target.style.background = '#f8fafc'
}

/** Password strength helpers — pure functions, no state needed */
const getStrength = (pw) => {
  if (pw.length >= 12) return { label: 'Very Strong', color: '#10b981', width: '100%' }
  if (pw.length >= 8)  return { label: 'Medium',      color: '#f59e0b', width: '60%' }
  return                      { label: 'Weak',         color: '#ef4444', width: '25%' }
}

/** Reusable password input field */
function PasswordField({ label, value, onChange, placeholder }) {
  return (
    <div style={fieldGroup}>
      <label style={fieldLabel}>{label}</label>
      <input
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputBase}
        onFocus={focusInput}
        onBlur={blurInput}
      />
    </div>
  )
}

export default function PasswordTab({ pwForm, setPwForm, pwLoading, hasPassword, onSubmit }) {
  const strength = pwForm.newPassword ? getStrength(pwForm.newPassword) : null

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {hasPassword && (
        <>
          <PasswordField
            label="Current Password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="••••••••"
          />
          <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <PasswordField
          label="New Password"
          value={pwForm.newPassword}
          onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
          placeholder="Min 8 characters"
        />
        <PasswordField
          label="Confirm Password"
          value={pwForm.confirmPassword}
          onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Re-enter new password"
        />
      </div>

      {/* Strength meter */}
      {strength && (
        <div style={{ padding: '0 4px' }}>
          <div style={{ display: 'flex', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Strength:&nbsp;
            <span style={{ color: strength.color }}>{strength.label}</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: strength.width,
                background: strength.color,
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          id="btn-change-password"
          type="submit"
          disabled={pwLoading}
          style={{ ...btnDanger, cursor: pwLoading ? 'not-allowed' : 'pointer' }}
        >
          {pwLoading ? 'Updating...' : hasPassword ? 'Change Password' : 'Set Password'}
        </button>
      </div>
    </form>
  )
}
