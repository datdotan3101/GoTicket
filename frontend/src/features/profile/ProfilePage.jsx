/**
 * ProfilePage — Feature entry point.
 * Orchestrates useProfile hook + sub-components.
 * This file should stay thin — all logic lives in useProfile.js,
 * all UI lives in the Tab components.
 */
import { useState } from 'react'
import { User, Lock, AlertTriangle } from 'lucide-react'
import { useProfile } from './useProfile'
import ProfileSidebar from './ProfileSidebar'
import ProfileInfoTab from './ProfileInfoTab'
import PasswordTab from './PasswordTab'
import DeleteAccountTab from './DeleteAccountTab'
import { cardSection, sectionIconBox } from '../../styles/common'

/** Section header row: coloured icon box + title + subtitle */
function SectionHeader({ icon, title, subtitle, variant = 'blue' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
      <div style={sectionIconBox(variant)}>{icon}</div>
      <div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: variant === 'red' ? '#b91c1c' : '#0f172a' }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: variant === 'red' ? '#ef4444' : '#64748b' }}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const profile = useProfile()

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '60px 16px 80px', color: '#1e293b' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '32px' }}>

        {/* Left sidebar */}
        <ProfileSidebar
          user={profile.user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profileLoading={profile.profileLoading}
          fileInputRef={profile.fileInputRef}
          onAvatarChange={profile.handleAvatarChange}
        />

        {/* Right content */}
        <div style={{ flex: '3 1 500px', minWidth: '300px' }}>

          {activeTab === 'profile' && (
            <section style={cardSection}>
              <SectionHeader
                icon={<User size={20} />}
                title="Personal Info"
                subtitle="Update your display name and email address"
                variant="blue"
              />
              <ProfileInfoTab
                profileForm={profile.profileForm}
                setProfileForm={profile.setProfileForm}
                profileLoading={profile.profileLoading}
                onSubmit={profile.handleProfileSubmit}
              />
            </section>
          )}

          {activeTab === 'security' && (
            <section style={cardSection}>
              <SectionHeader
                icon={<Lock size={20} />}
                title="Password"
                subtitle={profile.hasPassword ? 'Ensure your account is secure' : 'Create a password for your account'}
                variant="red"
              />
              <PasswordTab
                pwForm={profile.pwForm}
                setPwForm={profile.setPwForm}
                pwLoading={profile.pwLoading}
                hasPassword={profile.hasPassword}
                onSubmit={profile.handlePasswordSubmit}
              />
            </section>
          )}

          {activeTab === 'danger' && (
            <section style={{ ...cardSection, border: '1px solid #fee2e2' }}>
              <SectionHeader
                icon={<AlertTriangle size={20} />}
                title="Danger Zone"
                subtitle="Permanently delete your account"
                variant="red"
              />
              <DeleteAccountTab
                showDeleteModal={profile.showDeleteModal}
                setShowDeleteModal={profile.setShowDeleteModal}
                deleteLoading={profile.deleteLoading}
                deleteConfirmText={profile.deleteConfirmText}
                setDeleteConfirmText={profile.setDeleteConfirmText}
                onConfirm={profile.confirmDeleteAccount}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
