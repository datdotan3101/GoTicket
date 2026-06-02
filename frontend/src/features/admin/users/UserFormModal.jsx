/**
 * UserFormModal — Reusable Add/Edit user modal form.
 * Same fields for both modes; differences driven by props.
 */
import { X } from 'lucide-react'
import { ROLES } from '../../../constants/roles'
import { modalBackdrop, modalBox } from '../../../styles/common'
import '../../../common/AdminStyles.css'

export default function UserFormModal({ mode = 'add', form, setForm, clubs, onSubmit, onClose }) {
  const isEdit = mode === 'edit'

  return (
    <div style={modalBackdrop}>
      <div style={modalBox}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            {isEdit ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form noValidate onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <label className="admin-label">Full Name *</label>
            <input
              type="text"
              maxLength={255}
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="admin-input"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="admin-label">Email *</label>
            <input
              type="email"
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="admin-input"
              placeholder="john@example.com"
            />
          </div>

          {/* Password — only for Add mode */}
          {!isEdit && (
            <div>
              <label className="admin-label">Password *</label>
              <input
                type="password"
                minLength={6}
                maxLength={100}
                value={form.password ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="admin-input"
                placeholder="Min 6 characters"
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="admin-label">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, clubId: '' }))}
              className="admin-input"
            >
              <option value={ROLES.MANAGER}>Manager</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.EDITOR}>Editor</option>
              <option value={ROLES.CHECKER}>Checker</option>
              {isEdit && <option value={ROLES.AUDIENCE}>Audience</option>}
            </select>
          </div>

          {/* Club — only for Manager role */}
          {form.role === ROLES.MANAGER && (
            <div>
              <label className="admin-label">Assign Club *</label>
              <select
                value={form.clubId || ''}
                onChange={(e) => setForm((f) => ({ ...f, clubId: e.target.value }))}
                className="admin-input"
              >
                <option value="">Select a club...</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#0f172a', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {isEdit ? 'Save Changes' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
