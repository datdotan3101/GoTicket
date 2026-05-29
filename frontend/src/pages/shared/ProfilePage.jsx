/* eslint-disable no-unused-vars */
import { useState, useRef } from 'react'
import { Camera, User, Lock, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { APP_ROUTES } from '../../constants/routes'
import { validateForm } from '../../utils/validator'
import { uploadService } from '../../services/uploadService'

const getAvatarInitial = (fullName) => {
  if (!fullName) return 'U'
  const words = fullName.trim().split(' ').filter(Boolean)
  return words[words.length - 1].charAt(0).toUpperCase()
}



export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const hasPassword = user?.hasPassword !== false
  const fileInputRef = useRef(null)

  /* ── profile state ── */
  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)

  /* ── password state ── */
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)

  /* ── delete account state ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  /* ── handlers ── */
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm({ fullName: profileForm.fullName }, { fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full name exceeds 255 characters.' } } })) return

    try {
      setProfileLoading(true)
      const res = await authService.updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
      })
      setUser(res.data.data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'An error occurred.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setProfileLoading(true)
      const uploadRes = await uploadService.uploadFile(file)
      const avatarUrl = uploadRes.data.url
      
      const res = await authService.updateProfile({
        fullName: profileForm.fullName.trim() || user.full_name,
        email: profileForm.email.trim() || user.email,
        avatarUrl
      })
      setUser(res.data.data)
      toast.success('Avatar updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot upload avatar.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const schema = {
      oldPassword: { required: 'Current password is required' },
      newPassword: { required: 'New password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' }, maxLength: { value: 15, message: 'Password exceeds 15 characters' }, regex: { pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).*$/, message: 'Password must contain a letter, a number, and a special character' } }
    }
    if (!validateForm(pwForm, schema)) return

    try {
      setPwLoading(true)
      await authService.changePassword({
        currentPassword: hasPassword ? pwForm.currentPassword : '',
        newPassword: pwForm.newPassword,
      })
      setUser({ ...user, hasPassword: true })
      toast.success(hasPassword ? 'Password changed successfully!' : 'Password set successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'An error occurred.')
    } finally {
      setPwLoading(false)
    }
  }

  const confirmDeleteAccount = async () => {
    try {
      setDeleteLoading(true)
      await authService.deleteAccount()
      logout()
      navigate(APP_ROUTES.HOME)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot delete account at this time.')
      setDeleteLoading(false)
      setShowDeleteModal(false)
      setDeleteConfirmText('')
    }
  }

  /* ── role badge colour ── */
  const roleColors = {
    admin: '#f59e0b',
    manager: '#8b5cf6',
    editor: '#3b82f6',
    checker: '#10b981',
    audience: '#6366f1',
  }
  const roleBg = roleColors[user?.role] ?? '#6366f1'

  const [activeTab, setActiveTab] = useState('profile')
  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'security', label: 'Password', icon: <Lock size={18} /> },
    ...(user?.role !== 'checker' ? [{ id: 'danger', label: 'Delete Account', icon: <AlertTriangle size={18} /> }] : [])
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '60px 16px 80px',
        color: '#1e293b'
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        
        {/* ── LEFT SIDEBAR ── */}
        <div style={{ flex: '1 1 280px', minWidth: '280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* User Profile Summary */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 0 0 4px rgba(99,102,241,.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change avatar"
              >
                {!user?.avatar_url && getAvatarInitial(user?.full_name)}
                {profileLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px' }}>⏳</span>
                  </div>
                )}
              </div>
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  border: '2px solid #ffffff',
                  fontSize: '14px'
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change avatar"
              >
                <Camera size={14} color="#64748b" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {user?.full_name || 'User'}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
              {user?.email}
            </p>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: '#e0e7ff',
                color: '#4f46e5',
              }}
            >
              {user?.role} Account
            </span>
          </div>

          {/* Navigation Menu */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === tab.id ? (tab.id === 'danger' ? '#fef2f2' : '#eff6ff') : 'transparent',
                  color: activeTab === tab.id ? (tab.id === 'danger' ? '#dc2626' : '#2563eb') : '#64748b',
                  fontSize: '15px',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) e.target.style.background = '#f8fafc'
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) e.target.style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: '18px', filter: activeTab === tab.id ? 'none' : 'grayscale(100%) opacity(0.7)' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div style={{ flex: '3 1 500px', minWidth: '300px' }}>
          
          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <section
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px 36px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  <User size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Personal Info</h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Update your display name and email address</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      fontSize: '15px',
                      color: '#1e293b',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1', e.target.style.background = '#fff')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0', e.target.style.background = '#f8fafc')}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      fontSize: '15px',
                      color: '#1e293b',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1', e.target.style.background = '#fff')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0', e.target.style.background = '#f8fafc')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    id="btn-save-profile"
                    type="submit"
                    disabled={profileLoading}
                    style={{
                      background: '#1e1514',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '14px 32px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: profileLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <section
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px 36px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Password</h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{hasPassword ? 'Ensure your account is secure' : 'Create a password for your account'}</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {hasPassword && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</label>
                    <input
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        fontSize: '15px',
                        color: '#1e293b',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#6366f1', e.target.style.background = '#fff')}
                      onBlur={e => (e.target.style.borderColor = '#e2e8f0', e.target.style.background = '#f8fafc')}
                    />
                  </div>
                )}

                {hasPassword && <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="Min 6 characters"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        fontSize: '15px',
                        color: '#1e293b',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#6366f1', e.target.style.background = '#fff')}
                      onBlur={e => (e.target.style.borderColor = '#e2e8f0', e.target.style.background = '#f8fafc')}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
                    <input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        fontSize: '15px',
                        color: '#1e293b',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#6366f1', e.target.style.background = '#fff')}
                      onBlur={e => (e.target.style.borderColor = '#e2e8f0', e.target.style.background = '#f8fafc')}
                    />
                  </div>
                </div>

                {pwForm.newPassword && (
                  <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'flex', justifySelf: 'flex-start', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Strength: <span style={{ marginLeft: '8px', color: pwForm.newPassword.length >= 12 ? '#10b981' : pwForm.newPassword.length >= 8 ? '#f59e0b' : '#ef4444' }}>
                        {pwForm.newPassword.length >= 12 ? 'Very Strong' : pwForm.newPassword.length >= 8 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: pwForm.newPassword.length >= 12 ? '100%' : pwForm.newPassword.length >= 8 ? '60%' : '25%',
                          background: pwForm.newPassword.length >= 12 ? '#10b981' : pwForm.newPassword.length >= 8 ? '#f59e0b' : '#ef4444',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '14px 32px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: pwLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {pwLoading ? 'Updating...' : (hasPassword ? 'Change Password' : 'Set Password')}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB: DANGER ZONE */}
          {activeTab === 'danger' && (
            <section
              style={{
                background: '#ffffff',
                border: '1px solid #fee2e2',
                borderRadius: '20px',
                padding: '32px 36px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#b91c1c' }}>Danger Zone</h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#ef4444' }}>Permanently delete your account</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: '#fef2f2', padding: '24px', borderRadius: '12px', border: '1px dashed #fca5a5' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>Thinking of leaving?</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>
                    When you delete your account, all personal information and purchased tickets may be hidden or permanently deleted from the system. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => e.target.style.background = '#b91c1c'}
                  onMouseLeave={e => e.target.style.background = '#dc2626'}
                >
                  Delete Account
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#dc2626' }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
                Confirm Account Deletion
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280', lineHeight: 1.5 }}>
                This action <strong style={{ color: '#dc2626' }}>cannot be undone</strong>. All your data may be permanently deleted or hidden from the system. Are you sure you want to continue?
              </p>
              
              <div style={{ textAlign: 'left', background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                  Please type <strong style={{ userSelect: 'none' }}>Delete</strong> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type 'Delete'..."
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5',
                    fontSize: '15px',
                    outline: 'none',
                    background: '#fff',
                    color: '#7f1d1d',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#ef4444'}
                  onBlur={e => e.target.style.borderColor = '#fca5a5'}
                />
              </div>
            </div>
            <div style={{ padding: '20px 32px 32px', display: 'flex', gap: '12px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  color: '#374151',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => !deleteLoading && (e.target.style.background = '#f3f4f6')}
                onMouseLeave={e => !deleteLoading && (e.target.style.background = '#fff')}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'Delete'}
                style={{
                  flex: 1,
                  background: deleteConfirmText === 'Delete' ? '#dc2626' : '#fca5a5',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  color: '#fff',
                  cursor: deleteLoading || deleteConfirmText !== 'Delete' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => {
                  if (!deleteLoading && deleteConfirmText === 'Delete') e.target.style.background = '#b91c1c'
                }}
                onMouseLeave={e => {
                  if (!deleteLoading && deleteConfirmText === 'Delete') e.target.style.background = '#dc2626'
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

