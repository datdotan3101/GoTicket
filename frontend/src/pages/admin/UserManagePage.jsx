import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ROLES } from '../../constants/roles'
import { clubService } from '../../services/clubService'
import { userService } from '../../services/userService'
import { unwrapData } from '../../utils/apiData'

export default function UserManagePage() {
  const [users, setUsers] = useState([])
  const [clubs, setClubs] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null })

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [usersRes, clubsRes] = await Promise.all([
          userService.getAll({ limit: 100 }),
          clubService.getAll(),
        ])
        const usersPayload = unwrapData(usersRes)
        setUsers(usersPayload?.data ?? usersPayload ?? [])
        setClubs(unwrapData(clubsRes) || [])
      } catch {
        setUsers([])
        setClubs([])
      }
    }

    fetchInitial()
  }, [])

  const refreshUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 100 })
      const payload = unwrapData(response)
      setUsers(payload?.data ?? payload ?? [])
    } catch {
      setUsers([])
    }
  }

  const toggleActive = async (user) => {
    try {
      await userService.setActive(user.id, !user.is_active)
      refreshUsers()
      toast.success(user.is_active ? 'Account locked successfully.' : 'Account unlocked successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot update active state.')
    }
  }

  const openConfirmModal = (user) => {
    if (user.is_active) {
      setConfirmModal({ isOpen: true, user })
    } else {
      toggleActive(user)
    }
  }

  const updateRole = async (user, role) => {
    try {
      let clubId = null
      if (role === ROLES.MANAGER) {
        const input = window.prompt('Enter club ID for manager role:')
        clubId = Number(input)
      }
      await userService.updateRole(user.id, role, clubId)
      refreshUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot update role.')
    }
  }

  const filteredUsers = activeTab === 'all' 
    ? users 
    : users.filter(user => user.role === activeTab)

  return (
    <section className="container page">
      <div className="section-head" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-2px', color: '#111827', lineHeight: 1, margin: 0 }}>Users</h1>
          <p className="section-subtitle" style={{ fontSize: '1rem', color: '#6b7280', marginTop: '8px' }}>
            Manage platform users, roles, and account statuses.
          </p>
        </div>
      </div>

      <div className="tab-bar" style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {['all', ...Object.values(ROLES)].map(role => (
          <button 
            key={role} 
            onClick={() => setActiveTab(role)}
            className={activeTab === role ? 'mc-btn mc-btn-primary' : 'mc-btn mc-btn-ghost'}
            style={{ 
              padding: '8px 20px', 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              background: activeTab === role ? '#111827' : 'transparent',
              color: activeTab === role ? '#fff' : '#64748b',
              fontWeight: 800,
              borderRadius: '99px',
              border: activeTab === role ? 'none' : '1px solid #e2e8f0'
            }}
          >
            {role}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
         <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
           Available club IDs: {clubs.map((club) => club.id).join(', ') || '--'}
         </span>
      </div>

      <div className="cards-grid">
        {filteredUsers.map((user) => (
          <article className="card" key={user.id} style={{ padding: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{user.full_name || 'No Name'}</h3>
              <span className={`badge ${user.role}`} style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem' }}>
                {user.role}
              </span>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#4b5563', display: 'grid', gap: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0 }}><strong>📧 Email:</strong> {user.email}</p>
              <p style={{ margin: 0 }}><strong>🛡️ Status:</strong> 
                <span style={{ marginLeft: '6px', color: user.is_active ? '#166534' : '#991b1b', fontWeight: 700 }}>
                  {user.is_active ? 'Active' : 'Locked'}
                </span>
              </p>
            </div>

            <div className="row-gap" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button 
                type="button" 
                onClick={() => openConfirmModal(user)}
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  fontSize: '0.75rem', 
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: user.is_active ? 'transparent' : '#111827',
                  color: user.is_active ? '#dc2626' : '#fff',
                  border: user.is_active ? '1px solid #dc2626' : 'none'
                }}
              >
                {user.is_active ? 'Lock Account' : 'Unlock Account'}
              </button>
              <select 
                defaultValue={user.role} 
                onChange={(event) => updateRole(user, event.target.value)}
                style={{ flex: 1, padding: '8px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              >
                {Object.values(ROLES).map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>No users found for this category.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: '#fee2e2', 
              color: '#dc2626', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 20px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: '#111827' }}>Confirm Lock</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.5, marginBottom: '28px' }}>
              Are you sure you want to lock the account for <strong>{confirmModal.user?.full_name || confirmModal.user?.email}</strong>? 
              This user will lose access to all platform features immediately.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, user: null })}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f3f4f6', color: '#4b5563', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toggleActive(confirmModal.user)
                  setConfirmModal({ isOpen: false, user: null })
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Yes, Lock it
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

