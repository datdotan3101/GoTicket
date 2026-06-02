/**
 * ProfileInfoTab — "Personal Info" tab content.
 * Receives state/handlers from useProfile via props.
 */
import { inputBase, fieldGroup, fieldLabel, btnPrimary } from '../../styles/common'

const focusInput = (e) => {
  e.target.style.borderColor = '#6366f1'
  e.target.style.background = '#fff'
}
const blurInput = (e) => {
  e.target.style.borderColor = '#e2e8f0'
  e.target.style.background = '#f8fafc'
}

export default function ProfileInfoTab({ profileForm, setProfileForm, profileLoading, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {[
        { label: 'Full Name', key: 'fullName', type: 'text' },
        { label: 'Email', key: 'email', type: 'email' },
      ].map(({ label, key, type }) => (
        <div key={key} style={fieldGroup}>
          <label style={fieldLabel}>{label}</label>
          <input
            type={type}
            value={profileForm[key]}
            onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
            style={inputBase}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          id="btn-save-profile"
          type="submit"
          disabled={profileLoading}
          style={{ ...btnPrimary, cursor: profileLoading ? 'not-allowed' : 'pointer' }}
        >
          {profileLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
