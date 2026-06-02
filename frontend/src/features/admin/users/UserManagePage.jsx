/**
 * UserManagePage — Refactored admin user management page.
 *
 * Logic → useUsers hook
 * Duplicate Add/Edit modal → UserFormModal (mode prop)
 * Header → AdminPageHeader shared component
 */
import { Search, UserPlus, Edit2, Lock, Unlock, TrendingUp, Users } from 'lucide-react'
import { ROLES } from '../../../constants/roles'
import ConfirmModal from '../../../components/ui/ConfirmModal'
import AdminPageHeader from '../shared/AdminPageHeader'
import UserFormModal from './UserFormModal'
import { useUsers } from './useUsers'
import { dotGridPage, btnAddNew, tableHeaderCell, tableCell, tableRow } from '../../../styles/common'
import '../../../common/AdminStyles.css'

const getInitials = (name) => {
  if (!name) return 'UN'
  const parts = name.split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: '#e0e7ff', text: '#3730a3' },
  { bg: '#ffedd5', text: '#c2410c' },
  { bg: '#fee2e2', text: '#b91c1c' },
]
const getAvatarColor = (initials) => AVATAR_COLORS[(initials.charCodeAt(0) || 0) % 3]

export default function UserManagePage() {
  const u = useUsers()

  return (
    <section style={{ ...dotGridPage, border: 'none', maxWidth: 'none' }}>
      <AdminPageHeader
        title={u.isManagerMode ? 'Staff & Account Management' : 'User Management'}
        subtitle="Professional stadium operations system"
        action={
          <button onClick={() => u.setIsAddOpen(true)} style={btnAddNew}>
            <UserPlus size={18} />
            Add New
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            {u.isManagerMode ? 'TOTAL STAFF' : 'TOTAL USERS'}
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '12px' }}>
            {u.displayUsers.length.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.9rem', fontWeight: 700 }}>
            <TrendingUp size={16} />
            <span>+12% this month</span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {/* Table header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} color="#0f172a" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {u.isManagerMode ? 'Account Managers' : 'Registered Users'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={u.searchTerm}
                onChange={(e) => u.setSearchTerm(e.target.value)}
                style={{ padding: '10px 16px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', width: '200px' }}
              />
            </div>
            {/* Role filter — manager mode only */}
            {u.isManagerMode && (
              <select
                value={u.roleFilter}
                onChange={(e) => u.setRoleFilter(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', background: '#fff', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
              >
                <option value="all">All Roles</option>
                {[ROLES.ADMIN, ROLES.MANAGER, ROLES.EDITOR, ROLES.CHECKER].map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}s</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table body */}
        <div style={{ padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name / Email', 'Role', ...(u.isManagerMode ? ['Club'] : []), 'Status', 'Actions'].map((h, i) => (
                  <th key={h} style={{ ...tableHeaderCell, textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {u.filteredUsers.map((user) => {
                const initials = getInitials(user.full_name)
                const colors = getAvatarColor(initials)
                return (
                  <tr key={user.id} style={tableRow}>
                    <td style={tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{user.full_name || 'No Name'}</div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tableCell}>
                      <span style={{ background: user.role === ROLES.MANAGER ? '#dbeafe' : '#f1f5f9', color: user.role === ROLES.MANAGER ? '#1e3a8a' : '#475569', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {user.role}
                      </span>
                    </td>
                    {u.isManagerMode && (
                      <td style={tableCell}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                          {user.club_name || u.clubs.find((c) => c.id === user.club_id)?.name || '—'}
                        </span>
                      </td>
                    )}
                    <td style={tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.is_active ? '#10b981' : '#ef4444' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: user.is_active ? '#10b981' : '#ef4444' }}>
                          {user.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tableCell, textAlign: 'right' }}>
                      <button onClick={() => u.openEdit(user)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', marginRight: '4px' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => u.openConfirmModal(user)}
                        style={{ background: 'none', border: 'none', color: user.is_active ? '#64748b' : '#ef4444', cursor: 'pointer', padding: '8px' }}
                        title={user.is_active ? 'Lock Account' : 'Unlock Account'}
                      >
                        {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {u.filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={u.isManagerMode ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={u.confirmModal.isOpen}
        onClose={() => u.setConfirmModal({ isOpen: false, user: null })}
        onConfirm={() => { u.toggleActive(u.confirmModal.user); u.setConfirmModal({ isOpen: false, user: null }) }}
        title={`Confirm ${u.confirmModal.user?.is_active ? 'Lock' : 'Unlock'}`}
        message={<>Are you sure you want to {u.confirmModal.user?.is_active ? 'lock' : 'unlock'} the account for <strong>{u.confirmModal.user?.full_name || u.confirmModal.user?.email}</strong>?</>}
        confirmLabel={`Yes, ${u.confirmModal.user?.is_active ? 'Lock' : 'Unlock'} it`}
        variant={u.confirmModal.user?.is_active ? 'danger' : 'success'}
      />

      {/* DRY: single UserFormModal replaces two identical modals (Add + Edit) */}
      {u.isAddOpen && (
        <UserFormModal
          mode="add"
          form={u.addForm}
          setForm={u.setAddForm}
          clubs={u.clubs}
          onSubmit={u.handleAddUser}
          onClose={() => u.setIsAddOpen(false)}
        />
      )}
      {u.isEditOpen && (
        <UserFormModal
          mode="edit"
          form={u.editForm}
          setForm={u.setEditForm}
          clubs={u.clubs}
          onSubmit={u.handleEditUser}
          onClose={() => u.setIsEditOpen(false)}
        />
      )}
    </section>
  )
}
