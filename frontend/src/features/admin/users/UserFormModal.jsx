/**
 * UserFormModal — Reusable Add/Edit user modal form.
 * Same fields for both modes; differences driven by props.
 */
import { X, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import Select from 'react-select'
import { ROLES } from '../../../constants/roles'
import { modalBackdrop, modalBox } from '../../../styles/common'
import '../../../common/AdminStyles.css'

export default function UserFormModal({ mode = 'add', form, setForm, clubs, onSubmit, onClose }) {
  const isEdit = mode === 'edit'
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div style={modalBackdrop}>
      <div style={modalBox}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-slate-900)', margin: 0 }}>
            {isEdit ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)' }}>
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
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  maxLength={100}
                  value={form.password ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="admin-input"
                  placeholder="Min 6 characters"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)',
                    display: 'flex', alignItems: 'center', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              <option value={ROLES.CHECKER}>Checker</option>
              {isEdit && <option value={ROLES.AUDIENCE}>Audience</option>}
            </select>
          </div>

          {/* Club — only for Manager role */}
          {form.role === ROLES.MANAGER && (
            <div>
              <label className="admin-label">Assign Club *</label>
              <Select
                options={clubs.map(c => ({ value: c.id, label: c.name }))}
                value={form.clubId ? { value: form.clubId, label: clubs.find(c => c.id === Number(form.clubId))?.name || clubs.find(c => c.id === form.clubId)?.name } : null}
                onChange={(selected) => setForm((f) => ({ ...f, clubId: selected ? selected.value : '' }))}
                placeholder="Select a club..."
                isClearable
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '10px',
                    borderColor: 'var(--color-slate-200)',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: 'var(--color-slate-300)'
                    }
                  })
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--color-slate-100)', color: 'var(--color-slate-600)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--color-slate-900)', color: 'var(--color-white)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {isEdit ? 'Save Changes' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
