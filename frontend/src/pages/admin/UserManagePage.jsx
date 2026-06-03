/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes'
import { toast } from 'react-toastify'
import { 
  Search, UserPlus, Edit2, Lock, Unlock, 
  X, TrendingUp, AlertCircle, Users, Eye, EyeOff, Trash2
} from 'lucide-react'
import { ROLES } from '../../constants/roles'
import { userService } from '../../services/userService'
import { approvalsService } from '../../services/approvalsService'
import { clubService } from '../../services/clubService'
import { unwrapData } from '../../utils/apiData'
import { formatDateTime } from '../../utils/formatters'
import { validateForm } from '../../utils/validator'
import '../../common/AdminStyles.css'
import ConfirmModal from '../../components/ui/ConfirmModal'

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
  const location = useLocation()
  const isManagerMode = location.pathname === APP_ROUTES.ADMIN_MANAGERS
  
  const [users, setUsers] = useState([])
  const [pendingMatches, setPendingMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null, type: 'toggle' })
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', role: ROLES.MANAGER, clubId: '' })
  const [showPassword, setShowPassword] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: null, fullName: '', email: '', role: '', clubId: '' })

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [usersRes, approvalsRes, clubsRes] = await Promise.all([
          userService.getAll({ limit: 100 }),
          approvalsService.getPending({ type: 'match' }),
          clubService.getAll({ limit: 100 })
        ])
        const usersPayload = unwrapData(usersRes)
        setUsers(usersPayload?.data ?? usersPayload ?? [])
        setPendingMatches(unwrapData(approvalsRes) || [])
        
        const clubsPayload = unwrapData(clubsRes)
        setClubs(clubsPayload?.data ?? clubsPayload ?? [])
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
    } catch { /* ignore */ }
  }

  const refreshPending = async () => {
    try {
      const response = await approvalsService.getPending({ type: 'match' })
      setPendingMatches(unwrapData(response) || [])
    } catch { /* ignore */ }
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
      setConfirmModal({ isOpen: true, user, type: 'toggle' })
    } else {
      toggleActive(user)
    }
  }

  const handleDeleteUser = async (user) => {
    try {
      await userService.remove(user.id)
      toast.success('Account deleted successfully.')
      refreshUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot delete account.')
    }
  }

  const openDeleteConfirmModal = (user) => {
    setConfirmModal({ isOpen: true, user, type: 'delete' })
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

  const validateAddForm = () => {
    const schema = {
      fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full Name exceeds 255 characters' } },
      email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
      password: { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' }, maxLength: { value: 100, message: 'Password exceeds 100 characters' }, regex: { pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).*$/, message: 'Password must contain an uppercase letter, a number, and a special character' } },
      clubId: { custom: (val) => (addForm.role === ROLES.MANAGER && !val) ? 'Please assign a club for Manager role' : null }
    }
    return validateForm(addForm, schema)
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!validateAddForm()) return
    
    try {
      await userService.create(addForm)
      toast.success("User created successfully.")
      setIsAddModalOpen(false)
      setShowPassword(false)
      setAddForm({ fullName: '', email: '', password: '', role: ROLES.MANAGER, clubId: '' })
      refreshUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user.')
    }
  }

  const openEditModal = (user) => {
    setEditForm({
      id: user.id,
      fullName: user.full_name || '',
      email: user.email || '',
      role: user.role || ROLES.MANAGER,
      clubId: user.club_id || ''
    })
    setIsEditModalOpen(true)
  }

  const validateEditForm = () => {
    const schema = {
      fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full Name exceeds 255 characters' } },
      email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
      clubId: { custom: (val) => (editForm.role === ROLES.MANAGER && !val) ? 'Please assign a club for Manager role' : null }
    }
    return validateForm(editForm, schema)
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    if (!validateEditForm()) return
    
    try {
      await userService.update(editForm.id, editForm)
      toast.success("User updated successfully.")
      setIsEditModalOpen(false)
      refreshUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user.')
    }
  }

  const displayUsers = users.filter(u => {
    const userRole = u.role?.toLowerCase()
    const matchesRoleFilter = roleFilter === 'all' || userRole === roleFilter.toLowerCase()
    
    if (isManagerMode) {
      const managerRoles = [ROLES.MANAGER, ROLES.ADMIN, ROLES.EDITOR, ROLES.CHECKER]
      return matchesRoleFilter && managerRoles.includes(userRole)
    } else {
      return userRole === ROLES.AUDIENCE || !u.role
    }
  })

  const filteredUsers = displayUsers.filter(u => 
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
          {isManagerMode ? 'Staff & Account Management' : 'User Management'}
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
            {isManagerMode ? 'TOTAL STAFF' : 'TOTAL USERS'}
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '12px' }}>
            {displayUsers.length.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.9rem', fontWeight: 700 }}>
            <TrendingUp size={16} />
            <span>+12% this month</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Left Column: Staff List */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={24} color="#0f172a" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {isManagerMode ? 'Account Managers' : 'Registered Users'}
              </h2>
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
              {isManagerMode && (
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', background: '#fff', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                >
                  <option value="all">All Roles</option>
                  <option value={ROLES.ADMIN}>Admins</option>
                  <option value={ROLES.MANAGER}>Managers</option>
                  <option value={ROLES.EDITOR}>Editors</option>
                  <option value={ROLES.CHECKER}>Checkers</option>
                </select>
              )}
              <button 
                onClick={() => { setIsAddModalOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
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
                  {isManagerMode && (
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>CLUB</th>
                  )}
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
                        <span style={{ background: (user.role === ROLES.MANAGER || user.role === 'MANAGER') ? '#dbeafe' : '#f1f5f9', color: (user.role === ROLES.MANAGER || user.role === 'MANAGER') ? '#1e3a8a' : '#475569', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {user.role}
                        </span>
                      </td>
                      {isManagerMode && (
                        <td style={{ padding: '16px 0' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                            {user.club_name || clubs.find(c => c.id === user.club_id)?.name || '—'}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.is_active ? '#10b981' : '#ef4444' }}></div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: user.is_active ? '#10b981' : '#ef4444' }}>
                            {user.is_active ? 'Active' : 'Blocked'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 0', textAlign: 'right' }}>
                        <button onClick={() => openEditModal(user)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', marginRight: '4px' }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openConfirmModal(user)}
                          style={{ background: 'none', border: 'none', color: user.is_active ? '#64748b' : '#ef4444', cursor: 'pointer', padding: '8px', marginRight: '4px' }} 
                          title={user.is_active ? 'Lock Account' : 'Unlock Account'}
                        >
                          {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button onClick={() => openDeleteConfirmModal(user)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }} title="Delete">
                          <Trash2 size={16} />
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
            View All {isManagerMode ? 'Staff' : 'Users'}
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null, type: 'toggle' })}
        onConfirm={() => {
          if (confirmModal.type === 'delete') {
            handleDeleteUser(confirmModal.user)
          } else {
            toggleActive(confirmModal.user)
          }
          setConfirmModal({ isOpen: false, user: null, type: 'toggle' })
        }}
        title={confirmModal.type === 'delete' ? 'Delete Account' : `Confirm ${confirmModal.user?.is_active ? 'Lock' : 'Unlock'}`}
        message={
          confirmModal.type === 'delete' ? (
            <>Are you sure you want to completely delete the account for <strong>{confirmModal.user?.full_name || confirmModal.user?.email}</strong>? This action cannot be undone.</>
          ) : (
            <>Are you sure you want to {confirmModal.user?.is_active ? 'lock' : 'unlock'} the account for <strong>{confirmModal.user?.full_name || confirmModal.user?.email}</strong>?</>
          )
        }
        confirmLabel={confirmModal.type === 'delete' ? 'Yes, Delete it' : `Yes, ${confirmModal.user?.is_active ? 'Lock' : 'Unlock'} it`}
        variant={confirmModal.type === 'delete' ? 'danger' : (confirmModal.user?.is_active ? 'danger' : 'success')}
      />

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Add New Member</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            <form noValidate onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="admin-label">Full Name *</label>
                <input type="text" maxLength={255} value={addForm.fullName} onChange={e => {setAddForm({...addForm, fullName: e.target.value})}} className="admin-input" placeholder="John Doe" />
              </div>
              <div>
                <label className="admin-label">Email *</label>
                <input type="email" maxLength={255} value={addForm.email} onChange={e => {setAddForm({...addForm, email: e.target.value})}} className="admin-input" placeholder="john@example.com" />
              </div>
              <div>
                <label className="admin-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} minLength={6} maxLength={100} value={addForm.password} onChange={e => {setAddForm({...addForm, password: e.target.value})}} className="admin-input" placeholder="Min 6 characters" style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="admin-label">Role</label>
                <select value={addForm.role} onChange={e => {setAddForm({...addForm, role: e.target.value, clubId: ''})}} className="admin-input">
                  <option value={ROLES.MANAGER}>Manager</option>
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.EDITOR}>Editor</option>
                  <option value={ROLES.CHECKER}>Checker</option>
                </select>
              </div>
              {addForm.role === ROLES.MANAGER && (
                <div>
                  <label className="admin-label">Assign Club *</label>
                  <select value={addForm.clubId} onChange={e => {setAddForm({...addForm, clubId: e.target.value})}} className="admin-input">
                    <option value="">Select a club...</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#0f172a', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Create Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Edit Member</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            <form noValidate onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="admin-label">Full Name *</label>
                <input type="text" maxLength={255} value={editForm.fullName} onChange={e => {setEditForm({...editForm, fullName: e.target.value})}} className="admin-input" placeholder="John Doe" />
              </div>
              <div>
                <label className="admin-label">Email *</label>
                <input type="email" maxLength={255} value={editForm.email} onChange={e => {setEditForm({...editForm, email: e.target.value})}} className="admin-input" placeholder="john@example.com" />
              </div>
              <div>
                <label className="admin-label">Role</label>
                <select value={editForm.role} onChange={e => {setEditForm({...editForm, role: e.target.value, clubId: ''})}} className="admin-input">
                  <option value={ROLES.MANAGER}>Manager</option>
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.EDITOR}>Editor</option>
                  <option value={ROLES.CHECKER}>Checker</option>
                  <option value={ROLES.AUDIENCE}>Audience</option>
                </select>
              </div>
              {editForm.role === ROLES.MANAGER && (
                <div>
                  <label className="admin-label">Assign Club *</label>
                  <select value={editForm.clubId || ''} onChange={e => {setEditForm({...editForm, clubId: e.target.value})}} className="admin-input">
                    <option value="">Select a club...</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#0f172a', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
