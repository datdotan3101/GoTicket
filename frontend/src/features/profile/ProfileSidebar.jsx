/**
 * ProfileSidebar — Left panel: avatar + tab navigation.
 * Receives user + tab state from ProfilePage.
 */
import { Camera, User, Lock, AlertTriangle } from 'lucide-react'
import { card } from '../../styles/common'

const getAvatarInitial = (fullName) => {
  if (!fullName) return 'U'
  const words = fullName.trim().split(' ').filter(Boolean)
  return words[words.length - 1].charAt(0).toUpperCase()
}

const ROLE_COLORS = {
  admin:    'var(--color-warning)',
  manager:  '#8b5cf6',
  editor:   'var(--color-primary)',
  checker:  'var(--color-success)',
  audience: 'var(--color-primary)',
}

/** Tab button — active/inactive styles computed here */
function TabButton({ tab, isActive, onClick }) {
  const isDanger = tab.id === 'danger'
  return (
    <button
      onClick={() => onClick(tab.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: 'none',
        background: isActive ? (isDanger ? '#fef2f2' : 'var(--color-primary-50)') : 'transparent',
        color: isActive ? (isDanger ? 'var(--color-danger-dark)' : 'var(--color-primary-600)') : 'var(--color-slate-500)',
        fontSize: '15px',
        fontWeight: isActive ? 800 : 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-slate-50)' }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ filter: isActive ? 'none' : 'grayscale(100%) opacity(0.7)' }}>
        {tab.icon}
      </span>
      {tab.label}
    </button>
  )
}

export default function ProfileSidebar({
  user,
  activeTab,
  onTabChange,
  profileLoading,
  fileInputRef,
  onAvatarChange,
}) {
  const roleBg = ROLE_COLORS[user?.role] ?? 'var(--color-primary)'

  const tabs = [
    { id: 'profile',  label: 'Personal Info',   icon: <User size={18} /> },
    { id: 'security', label: 'Password',         icon: <Lock size={18} /> },
    ...(user?.role !== 'checker'
      ? [{ id: 'danger', label: 'Delete Account', icon: <AlertTriangle size={18} /> }]
      : []),
  ]

  return (
    <div style={{ flex: '1 1 280px', minWidth: '280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Avatar + name */}
      <div style={{ ...card, borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
          {/* Avatar circle */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: user?.avatar_url
                ? `url(${user.avatar_url}) center/cover`
                : 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--color-white)',
              boxShadow: '0 0 0 4px rgba(99,102,241,.1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
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

          {/* Camera icon badge */}
          <div
            style={{
              position: 'absolute', bottom: '-2px', right: '-2px',
              background: 'var(--color-white)', borderRadius: '50%',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              cursor: 'pointer', border: '2px solid var(--color-white)',
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Click to change avatar"
          >
            <Camera size={14} color="var(--color-slate-500)" />
          </div>
        </div>

        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={onAvatarChange} />
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          {user?.full_name || 'User'}
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--color-slate-500)' }}>{user?.email}</p>
        <span style={{
          display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          background: 'var(--color-primary-100)', color: 'var(--color-primary-600)',
        }}>
          {user?.role} Account
        </span>
      </div>

      {/* Tab navigation */}
      <div style={{ ...card, borderRadius: '20px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={onTabChange}
          />
        ))}
      </div>
    </div>
  )
}
