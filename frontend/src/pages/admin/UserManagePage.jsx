import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { 
  Search, UserPlus, Edit2, Lock, Unlock, 
  Bell, Check, X, Info, Calendar, Clock, Gauge, TrendingUp, AlertCircle, Users
} from 'lucide-react'
import { userService } from '../../services/userService'
import { approvalsService } from '../../services/approvalsService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatDate'

const RECENT_ACTIVITY = [
  { id: 1, type: 'approve', message: 'Admin-02 approved "Rock Festival 2023"', time: 'Today, 09:15 AM' },
  { id: 2, type: 'reject', message: 'Rejected Stadium Config update: My Dinh Stadium', time: 'Yesterday, 17:40 PM' }
]

const getInitials = (name) => {
  if (!name) return 'UN'
  const parts = name.split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

const getAvatarColor = (initials) => {
  const charCode = initials.charCodeAt(0) || 0
  if (charCode % 3 === 0) return { bg: '#e0e7ff', text: '#3730a3' }
  if (charCode % 3 === 1) return { bg: '#ffedd5', text: '#c2410c' }
  return { bg: '#fee2e2', text: '#b91c1c' }
}

export default function UserManagePage() {
  const [users, setUsers] = useState([])
  const [pendingMatches, setPendingMatches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null })

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [usersRes, approvalsRes] = await Promise.all([
          userService.getAll({ limit: 100 }),
          approvalsService.getPending({ type: 'match' })
        ])
        const usersPayload = unwrapData(usersRes)
        setUsers(usersPayload?.data ?? usersPayload ?? [])
        setPendingMatches(unwrapData(approvalsRes) || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchInitial()
  }, [])

  const refreshUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 100 })
      const payload = unwrapData(response)
      setUsers(payload?.data ?? payload ?? [])
    } catch (err) {}
  }

  const refreshPending = async () => {
    try {
      const response = await approvalsService.getPending({ type: 'match' })
      setPendingMatches(unwrapData(response) || [])
    } catch (err) {}
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

  const handleApproveMatch = async (id) => {
    try {
      await approvalsService.approve(id)
      toast.success('Approved.')
      refreshPending()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approve failed.')
    }
  }

  const handleRejectMatch = async (id) => {
    const reason = window.prompt("Enter rejection reason:")
    if (!reason) return
    try {
      await approvalsService.reject(id, reason)
      toast.success('Rejected.')
      refreshPending()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reject failed.')
    }
  }

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const pendingMatchesCount = pendingMatches.length.toString().padStart(2, '0')

  return (
    <section className="container page" style={{
      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '40px',
      paddingBottom: '80px',
      border: 'none',
      maxWidth: 'none'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          User Management & Approvals
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '20px', background: '#f97316', borderRadius: '2px' }}></div>
          <span style={{ color: '#64748b', fontSize: '1.05rem', fontStyle: 'italic' }}>
            Professional stadium operations system
          </span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Total Users */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            TOTAL USERS
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '12px' }}>
            {users.length.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.9rem', fontWeight: 700 }}>
            <TrendingUp size={16} />
            <span>+12% this month</span>
          </div>
        </div>

        {/* Pending Matches */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            PENDING MATCHES
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#ea580c', lineHeight: 1 }}>
              {pendingMatchesCount}
            </div>
          </div>
          <div>
            <span style={{ display: 'inline-block', background: '#ffedd5', color: '#c2410c', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800 }}>
              Needs action
            </span>
          </div>
        </div>

        {/* Operational Capacity */}
        <div style={{ background: '#0f172a', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
              OPERATIONAL CAPACITY
            </div>
            <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: '#f97316', borderRadius: '4px' }}></div>
            </div>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, marginRight: '8px' }}>85%</span>
              <span style={{ color: '#94a3b8' }}>System Efficiency</span>
            </div>
          </div>
          <div style={{ width: '64px', height: '64px', background: '#1e293b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Gauge size={32} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Staff List */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={24} color="#0f172a" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Staff List</h2>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 16px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', width: '200px' }}
                />
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                <UserPlus size={18} />
                Add New
              </button>
            </div>
          </div>
          
          <div style={{ padding: '0 24px', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>NAME / EMAIL</th>
                  <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>ROLE</th>
                  <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>STATUS</th>
                  <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 5).map((user) => {
                  const initials = getInitials(user.full_name)
                  const colors = getAvatarColor(initials)
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{user.full_name || 'No Name'}</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 0' }}>
                        <span style={{ background: user.role === 'MANAGER' ? '#dbeafe' : '#f1f5f9', color: user.role === 'MANAGER' ? '#1e3a8a' : '#475569', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.is_active ? '#10b981' : '#ef4444' }}></div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: user.is_active ? '#10b981' : '#ef4444' }}>
                            {user.is_active ? 'Active' : 'Blocked'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 0', textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', marginRight: '4px' }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openConfirmModal(user)}
                          style={{ background: 'none', border: 'none', color: user.is_active ? '#64748b' : '#ef4444', cursor: 'pointer', padding: '8px' }} 
                          title={user.is_active ? 'Lock Account' : 'Unlock Account'}
                        >
                          {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <button style={{ background: '#f8fafc', border: 'none', borderTop: '1px solid #f1f5f9', padding: '16px', width: '100%', fontWeight: 700, color: '#475569', cursor: 'pointer', fontSize: '0.9rem', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
          >
            View All Users
          </button>
        </div>

        {/* Right Column: Approvals & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Match Approvals */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Bell size={20} color="#ea580c" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Match Approvals</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingMatches.slice(0, 2).map((match, idx) => (
                <div key={match.id} style={{ 
                  background: '#fff', 
                  borderRadius: '12px', 
                  border: idx === 0 ? '2px dashed #f97316' : '1px solid #e2e8f0', 
                  padding: '16px',
                  boxShadow: idx === 0 ? '0 4px 10px rgba(249, 115, 22, 0.1)' : 'none'
                }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: '#f1f5f9', backgroundImage: `url(${match.thumbnail_url || 'https://images.unsplash.com/photo-1518605368461-1ee0676644ec?w=200'})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                          {match.home_team} vs {match.away_team}
                        </h3>
                        {idx === 0 && <span style={{ background: '#f97316', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>NEW</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>{match.stadium_name || 'Stadium'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>
                        <Calendar size={14} />
                        {match.match_date ? formatDateTime(match.match_date) : 'TBA'}
                      </div>
                    </div>
                  </div>
                  
                  {idx === 0 && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <button onClick={() => handleApproveMatch(match.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Check size={16} /> Approve
                      </button>
                      <button onClick={() => handleRejectMatch(match.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <X size={16} /> Reject
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 800 }}>
                      {(match.submitted_by_name || 'A')[0]}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Created by <span style={{ fontWeight: 700, color: '#0f172a' }}>{match.submitted_by_name || 'Admin'}</span> • 10 mins ago
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingMatches.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
                  No pending approvals.
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#0f172a', borderRadius: '16px', padding: '24px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Clock size={20} color="#f97316" />
              <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Activity</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {RECENT_ACTIVITY.map(activity => (
                <div key={activity.id} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '3px', background: activity.type === 'approve' ? '#10b981' : '#ef4444', borderRadius: '2px' }}></div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.4 }}>
                      {activity.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '64px', height: '64px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: '#0f172a' }}>Confirm Lock</h2>
            <p style={{ color: '#64748b', lineHeight: 1.5, marginBottom: '28px', fontSize: '0.95rem' }}>
              Are you sure you want to lock the account for <strong>{confirmModal.user?.full_name || confirmModal.user?.email}</strong>? 
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmModal({ isOpen: false, user: null })} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => { toggleActive(confirmModal.user); setConfirmModal({ isOpen: false, user: null }) }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Yes, Lock it
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

